const User    = require('../models/User');
const Listing = require('../models/Listing');
const Thread  = require('../models/Thread');
const Message = require('../models/Message');
const { successResponse, errorResponse } = require('../utils/response');

// ── Users ─────────────────────────────────────────────────────────────────────

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isBlocked } = req.query;
    const filter = {};
    if (search)    filter.$or = [
      { name:  new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
    if (role)      filter.role      = role;
    if (isBlocked !== undefined) filter.isBlocked = isBlocked === 'true';

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return successResponse(res, {
      users,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, role, isBlocked, isVerifiedStudent, isEmailConfirmed } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);

    // Prevent admin from accidentally demoting themselves
    if (String(user._id) === String(req.user._id) && role && role !== 'admin') {
      return errorResponse(res, 'Cannot change your own admin role', 400);
    }

    if (name  !== undefined) user.name  = name;
    if (email !== undefined) user.email = email;
    if (role  !== undefined) user.role  = role;
    if (isBlocked          !== undefined) user.isBlocked          = isBlocked;
    if (isVerifiedStudent  !== undefined) user.isVerifiedStudent  = isVerifiedStudent;
    if (isEmailConfirmed   !== undefined) user.isEmailConfirmed   = isEmailConfirmed;

    await user.save();
    return successResponse(res, { user: user.toPublicProfile() }, 'User updated');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return errorResponse(res, 'Cannot delete your own admin account', 400);
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);

    // Cascade: set their listings to offMarket
    await Listing.updateMany({ owner: req.params.id }, { status: 'offMarket' });

    return successResponse(res, null, 'User deleted');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── Listings ──────────────────────────────────────────────────────────────────

const getAllListings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [
      { title:      new RegExp(search, 'i') },
      { university: new RegExp(search, 'i') },
      { city:       new RegExp(search, 'i') },
    ];

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Listing.countDocuments(filter);
    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'name email');

    return successResponse(res, {
      listings,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const reactivateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return errorResponse(res, 'Listing not found', 404);

    listing.status = 'active';
    const expiry   = new Date();
    expiry.setDate(expiry.getDate() + 90);
    listing.expiresAt = expiry;
    await listing.save();

    // Update thread snapshots
    await Thread.updateMany({ listing: listing._id }, { 'listingSnapshot.status': 'active' });

    return successResponse(res, { listing }, 'Listing reactivated — expiry reset to 90 days');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const adminDeleteListing = async (req, res) => {
  try {
    const listing = await Listing.findByIdAndDelete(req.params.id);
    if (!listing) return errorResponse(res, 'Listing not found', 404);
    await User.updateMany({ favorites: listing._id }, { $pull: { favorites: listing._id } });
    return successResponse(res, null, 'Listing permanently deleted');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── Threads (moderation) ──────────────────────────────────────────────────────

const getAllThreads = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Thread.countDocuments();
    const threads = await Thread.find()
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('participants', 'name email')
      .populate('listing', 'title');

    return successResponse(res, {
      threads,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── Stats ─────────────────────────────────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const [totalUsers, totalListings, activeListings, totalThreads] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'active' }),
      Thread.countDocuments(),
    ]);
    const boostedListings = await Listing.countDocuments({ boostedUntil: { $gt: new Date() } });
    return successResponse(res, { totalUsers, totalListings, activeListings, totalThreads, boostedListings });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── Boost listing ─────────────────────────────────────────────────────────────

const boostListing = async (req, res) => {
  try {
    const { days = 7 } = req.body;
    const listing = await Listing.findById(req.params.id);
    if (!listing) return errorResponse(res, 'Listing not found', 404);

    const until = new Date();
    until.setDate(until.getDate() + parseInt(days));
    listing.boostedUntil = until;
    await listing.save();

    const io = req.app.get('io');
    if (io) io.emit('listingStatusUpdated', { listingId: String(listing._id), status: listing.status });

    return successResponse(res, { boostedUntil: listing.boostedUntil }, `Listing boosted for ${days} days`);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── Remove boost ──────────────────────────────────────────────────────────────

const unboostListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return errorResponse(res, 'Listing not found', 404);
    listing.boostedUntil = null;
    await listing.save();
    return successResponse(res, null, 'Boost removed');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── Force listing status ──────────────────────────────────────────────────────

const forceListingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'pending', 'offMarket'].includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }
    const listing = await Listing.findById(req.params.id);
    if (!listing) return errorResponse(res, 'Listing not found', 404);

    listing.status = status;
    if (status === 'active') {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 90);
      listing.expiresAt = expiry;
    }
    await listing.save();
    await Thread.updateMany({ listing: listing._id }, { 'listingSnapshot.status': status });

    const io = req.app.get('io');
    if (io) io.emit('listingStatusUpdated', { listingId: String(listing._id), status });

    return successResponse(res, { status }, 'Status updated');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = {
  getStats,
  getUsers, updateUser, deleteUser,
  getAllListings, reactivateListing, adminDeleteListing,
  boostListing, unboostListing, forceListingStatus,
  getAllThreads,
};
