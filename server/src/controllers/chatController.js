const Thread  = require('../models/Thread');
const Message = require('../models/Message');
const Listing = require('../models/Listing');
const { successResponse, errorResponse } = require('../utils/response');

// ── POST /api/threads ─────────────────────────────────────────────────────────
// Start a new thread between an inquirer and a lister for a listing
const createThread = async (req, res) => {
  try {
    const { listingId } = req.body;

    const listing = await Listing.findById(listingId).populate('owner', 'name');
    if (!listing) return errorResponse(res, 'Listing not found', 404);

    // Cannot message yourself
    if (String(listing.owner._id) === String(req.user._id)) {
      return errorResponse(res, 'You cannot message yourself about your own listing', 400);
    }

    // Check if thread already exists between this pair for this listing
    const existing = await Thread.findOne({
      listing:      listingId,
      participants: { $all: [req.user._id, listing.owner._id] },
    });

    if (existing) {
      return successResponse(res, { thread: existing }, 'Thread already exists');
    }

    // Snapshot listing data — survives listing deletion/expiry
    const thread = await Thread.create({
      listing:     listingId,
      participants: [req.user._id, listing.owner._id],
      listingSnapshot: {
        title:     listing.title,
        mainImage: listing.images[0] || '',
        price:     listing.price,
        status:    listing.status,
      },
    });

    await thread.populate('participants', 'name isVerifiedStudent');

    return successResponse(res, { thread }, 'Conversation started', 201);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── GET /api/threads ──────────────────────────────────────────────────────────
// All threads for the current user — sorted by most recent message
const getThreads = async (req, res) => {
  try {
    const threads = await Thread.find({
      participants: req.user._id,
      deletedBy:    { $ne: req.user._id }, // hide threads this user deleted
    })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'name isVerifiedStudent')
      .lean();

    // Count unread messages per thread
    const threadsWithUnread = await Promise.all(
      threads.map(async (thread) => {
        const unreadCount = await Message.countDocuments({
          thread: thread._id,
          sender: { $ne: req.user._id }, // messages not sent by me
          readBy: { $ne: req.user._id }, // that I haven't read
        });

        const isBlocked = thread.blockedBy?.map(String).includes(String(req.user._id));

        return { ...thread, unreadCount, isBlocked };
      })
    );

    // Total unread across all threads (for navbar badge)
    const totalUnread = threadsWithUnread.reduce((sum, t) => sum + t.unreadCount, 0);

    return successResponse(res, { threads: threadsWithUnread, totalUnread });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── GET /api/threads/:id/messages ─────────────────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) return errorResponse(res, 'Thread not found', 404);

    // Only participants can read messages
    if (!thread.participants.map(String).includes(String(req.user._id))) {
      return errorResponse(res, 'Not authorized', 403);
    }

    const messages = await Message.find({ thread: thread._id })
      .sort({ createdAt: 1 })
      .populate('sender', 'name isVerifiedStudent')
      .lean();

    // Mark all unread messages as read by current user
    await Message.updateMany(
      {
        thread: thread._id,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    );

    return successResponse(res, { messages, thread });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── POST /api/threads/:id/messages ────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) return errorResponse(res, 'Thread not found', 404);

    if (!thread.participants.map(String).includes(String(req.user._id))) {
      return errorResponse(res, 'Not authorized', 403);
    }

    // Block check — if either party has blocked, no new messages
    if (thread.blockedBy?.length > 0) {
      return errorResponse(res, 'This conversation has been blocked', 403);
    }

    const message = await Message.create({
      thread: thread._id,
      sender: req.user._id,
      body:   req.body.body,
      readBy: [req.user._id], // sender has already "read" their own message
    });

    // Update thread preview
    thread.lastMessage   = req.body.body.substring(0, 80);
    thread.lastMessageAt = new Date();
    await thread.save();

    await message.populate('sender', 'name isVerifiedStudent');

    // Emit via Socket.io to the other participant
    const io        = req.app.get('io');
    const recipient = thread.participants.find(
      (p) => String(p) !== String(req.user._id)
    );
    if (io && recipient) {
      io.to(`user:${recipient}`).emit('newMessage', {
        threadId: thread._id,
        message,
      });
      io.to(`user:${recipient}`).emit('unreadCountUpdate');
    }

    return successResponse(res, { message }, 'Message sent', 201);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── PATCH /api/threads/:id/block ──────────────────────────────────────────────
const blockThread = async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) return errorResponse(res, 'Thread not found', 404);
    if (!thread.participants.map(String).includes(String(req.user._id))) {
      return errorResponse(res, 'Not authorized', 403);
    }

    const alreadyBlocked = thread.blockedBy.map(String).includes(String(req.user._id));
    if (alreadyBlocked) {
      // Unblock
      thread.blockedBy = thread.blockedBy.filter(
        (id) => String(id) !== String(req.user._id)
      );
    } else {
      thread.blockedBy.push(req.user._id);
    }
    await thread.save();

    return successResponse(
      res,
      { blocked: !alreadyBlocked },
      alreadyBlocked ? 'Thread unblocked' : 'Thread blocked'
    );
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── PATCH /api/threads/:id/delete ─────────────────────────────────────────────
// Soft delete — hides thread from this user only. Truly deleted when both delete.
const deleteThread = async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) return errorResponse(res, 'Thread not found', 404);
    if (!thread.participants.map(String).includes(String(req.user._id))) {
      return errorResponse(res, 'Not authorized', 403);
    }

    if (!thread.deletedBy.map(String).includes(String(req.user._id))) {
      thread.deletedBy.push(req.user._id);
    }

    // Both participants deleted — remove thread and messages entirely
    if (thread.deletedBy.length === thread.participants.length) {
      await Message.deleteMany({ thread: thread._id });
      await thread.deleteOne();
      return successResponse(res, null, 'Thread permanently deleted');
    }

    await thread.save();
    return successResponse(res, null, 'Thread removed from your inbox');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── GET /api/threads/unread-count ─────────────────────────────────────────────
// Lightweight endpoint — navbar badge polls this
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      sender: { $ne: req.user._id },
      readBy: { $ne: req.user._id },
      thread: {
        $in: await Thread.find({
          participants: req.user._id,
          deletedBy: { $ne: req.user._id },
        }).distinct('_id'),
      },
    });
    return successResponse(res, { unreadCount: count });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = {
  createThread,
  getThreads,
  getMessages,
  sendMessage,
  blockThread,
  deleteThread,
  getUnreadCount,
};
