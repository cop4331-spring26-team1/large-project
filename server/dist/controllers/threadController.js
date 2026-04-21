"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteThread = exports.blockThread = exports.sendMessage = exports.getMessages = exports.createThread = exports.getUnreadCount = exports.getThreads = void 0;
const Thread_1 = __importDefault(require("../models/Thread"));
const Message_1 = __importDefault(require("../models/Message"));
const Listing_1 = __importDefault(require("../models/Listing"));
const socket_1 = require("../lib/socket");
const getThreads = async (req, res) => {
    try {
        const threads = await Thread_1.default.find({
            participants: req.userId,
            deletedBy: { $ne: req.userId },
        })
            .populate('participants', 'name email isVerifiedStudent')
            .sort({ lastMessageAt: -1 });
        const withMeta = await Promise.all(threads.map(async (t) => {
            const unreadCount = await Message_1.default.countDocuments({
                thread: t._id,
                sender: { $ne: req.userId },
                readBy: { $ne: req.userId },
            });
            return {
                ...t.toObject(),
                unreadCount,
                isBlocked: t.blockedBy.some((id) => id.toString() === req.userId),
            };
        }));
        const totalUnread = withMeta.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
        res.status(200).json({ data: { threads: withMeta, totalUnread } });
    }
    catch (err) {
        console.error('getThreads error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getThreads = getThreads;
const getUnreadCount = async (req, res) => {
    try {
        const threads = await Thread_1.default.find({
            participants: req.userId,
            deletedBy: { $ne: req.userId },
        });
        const threadIds = threads.map((t) => t._id);
        const unreadCount = await Message_1.default.countDocuments({
            thread: { $in: threadIds },
            sender: { $ne: req.userId },
            readBy: { $ne: req.userId },
        });
        res.status(200).json({ data: { unreadCount } });
    }
    catch (err) {
        console.error('getUnreadCount error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getUnreadCount = getUnreadCount;
const createThread = async (req, res) => {
    try {
        if (!req.isEmailVerified) {
            res.status(403).json({ error: 'Please verify your email before messaging.' });
            return;
        }
        const { listingId, message: messageBody = 'Hi, I am interested in your listing!' } = req.body;
        const listing = await Listing_1.default.findById(listingId);
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        if (listing.owner.toString() === req.userId) {
            res.status(400).json({ error: 'You cannot message your own listing' });
            return;
        }
        const existing = await Thread_1.default.findOne({
            listing: listingId,
            participants: { $all: [req.userId, listing.owner] },
        });
        if (existing) {
            res.status(200).json({ data: { thread: existing } });
            return;
        }
        const thread = await Thread_1.default.create({
            listing: listingId,
            participants: [req.userId, listing.owner],
            listingSnapshot: {
                title: listing.title,
                mainImage: listing.images[0] || '',
                price: listing.price,
                status: listing.status,
            },
            lastMessage: messageBody,
            lastMessageAt: new Date(),
        });
        await Message_1.default.create({
            thread: thread._id,
            sender: req.userId,
            body: messageBody,
            readBy: [req.userId],
        });
        res.status(201).json({ data: { thread } });
    }
    catch (err) {
        console.error('createThread error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.createThread = createThread;
const getMessages = async (req, res) => {
    try {
        const thread = await Thread_1.default.findById(req.params.id);
        if (!thread) {
            res.status(404).json({ error: 'Thread not found' });
            return;
        }
        if (!thread.participants.some((p) => p.toString() === req.userId)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const messages = await Message_1.default.find({ thread: req.params.id })
            .populate('sender', 'name email')
            .sort({ createdAt: 1 });
        await Message_1.default.updateMany({ thread: req.params.id, sender: { $ne: req.userId }, readBy: { $ne: req.userId } }, { $push: { readBy: req.userId } });
        res.status(200).json({ data: { messages } });
    }
    catch (err) {
        console.error('getMessages error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getMessages = getMessages;
const sendMessage = async (req, res) => {
    try {
        if (!req.isEmailVerified) {
            res.status(403).json({ error: 'Please verify your email before messaging.' });
            return;
        }
        const thread = await Thread_1.default.findById(req.params.id);
        if (!thread) {
            res.status(404).json({ error: 'Thread not found' });
            return;
        }
        if (!thread.participants.some((p) => p.toString() === req.userId)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        if (thread.blockedBy.length > 0) {
            res.status(403).json({ error: 'This conversation is blocked' });
            return;
        }
        const message = await Message_1.default.create({
            thread: req.params.id,
            sender: req.userId,
            body: req.body.body,
            readBy: [req.userId],
        });
        thread.lastMessage = req.body.body;
        thread.lastMessageAt = new Date();
        thread.deletedBy = thread.deletedBy.filter((id) => id.toString() !== req.userId);
        await thread.save();
        const populated = await message.populate('sender', 'name email');
        thread.participants.forEach((p) => {
            if (p.toString() !== req.userId) {
                const recipientSocketId = socket_1.userSockets.get(p.toString());
                if (recipientSocketId) {
                    socket_1.io.to(recipientSocketId).emit('newMessage', {
                        threadId: req.params.id,
                        message: populated,
                    });
                    socket_1.io.to(recipientSocketId).emit('unreadCountUpdate');
                }
            }
        });
        res.status(201).json({ data: { message: populated } });
    }
    catch (err) {
        console.error('sendMessage error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.sendMessage = sendMessage;
const blockThread = async (req, res) => {
    try {
        const thread = await Thread_1.default.findById(req.params.id);
        if (!thread) {
            res.status(404).json({ error: 'Thread not found' });
            return;
        }
        if (!thread.participants.some((p) => p.toString() === req.userId)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const alreadyBlocked = thread.blockedBy.some((id) => id.toString() === req.userId);
        if (alreadyBlocked) {
            thread.blockedBy = thread.blockedBy.filter((id) => id.toString() !== req.userId);
        }
        else {
            thread.blockedBy.push(req.userId);
        }
        await thread.save();
        res.status(200).json({ data: thread });
    }
    catch (err) {
        console.error('blockThread error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.blockThread = blockThread;
const deleteThread = async (req, res) => {
    try {
        const thread = await Thread_1.default.findById(req.params.id);
        if (!thread) {
            res.status(404).json({ error: 'Thread not found' });
            return;
        }
        if (!thread.participants.some((p) => p.toString() === req.userId)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        thread.deletedBy.push(req.userId);
        await thread.save();
        res.status(200).json({ message: 'Thread deleted' });
    }
    catch (err) {
        console.error('deleteThread error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.deleteThread = deleteThread;
