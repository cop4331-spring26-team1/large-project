const Listing    = require('../models/Listing');
const University = require('../models/University');
const User       = require('../models/User');
const Thread     = require('../models/Thread');
const { geocodeAddress, haversineDistance } = require('../utils/geocode');
const { successResponse, errorResponse }    = require('../utils/response');
const { cloudinary }                        = require('../config/cloudinary');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build the sort object for listing queries.
 * Boosted listings always float to top, then apply requested sort.
 */
const buildSort = (sortBy) => {
  // Boosted first (boostedUntil in future = 1, else = 0), then secondary sort
  const boostField = { boostedUntil: -1 }; // null sorts below dates in Mongo
  switch (sortBy) {
    case 'price_asc':      return { ...boostField, price: 1,  createdAt: -1 };
    case 'price_desc':     return { ...boostField, price: -1, createdAt: -1 };
    case 'distance_asc':   return { ...boostField, distanceToCampus: 1,  createdAt: -1 };
    case 'distance_desc':  return { ...boostField, distanceToCampus: -1, createdAt: -1 };
    default:               return { ...boostField, createdAt: -1 }; // newest first
  }
};

// ── GET /api/listings ─────────────────────────────────────────────────────────
const getListings = async (req, res) => {
  try {
    const {
      page       = 1,
      limit      = 12,
      state,
      city,
      university,
      minPrice,
      maxPrice,
      bedrooms,
      petsAllowed,
      utilitiesIncluded,
      sortBy,
    } = req.query;

    // Build filter — only show active and pending to public
    const filter = { status: { $in: ['active', 'pending'] } };

    if (state)      filter.state      = state.toUpperCase();
    if (city)       filter.city       = new RegExp(city, 'i');
    if (university) filter.university = new RegExp(university, 'i');
    if (bedrooms !== undefined) filter.bedrooms = parseInt(bedrooms);
    if (petsAllowed !== undefined)
      filter.petsAllowed = petsAllowed === 'true';
    if (utilitiesIncluded !== undefined)
      filter.utilitiesIncluded = utilitiesIncluded === 'true';
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const sort  = buildSort(sortBy);
    const total = await Listing.countDocuments(filter);

    const listings = await Listing.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'name isVerifiedStudent')
      .lean();

    // If user is authenticated, mark which listings they've favorited
    let favoriteSet = new Set();
    if (req.user) {
      const user = await User.findById(req.user._id).select('favorites');
      favoriteSet = new Set(user.favorites.map(String));
    }

    const listingsWithMeta = listings.map((l) => ({
      ...l,
      isFavorited: favoriteSet.has(String(l._id)),
      isBoosted:   l.boostedUntil && new Date(l.boostedUntil) > new Date(),
      // Owner cannot favorite their own listing — flag for frontend
      isOwnListing: req.user ? String(l.owner._id) === String(req.user._id) : false,
    }));

    return successResponse(res, {
      listings: listingsWithMeta,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── GET /api/listings/mine ────────────────────────────────────────────────────
const getMyListings = async (req, res) => {
  try {
    // Returns ALL statuses including offMarket — lister can see their own archive
    const listings = await Listing.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, { listings });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── GET /api/listings/:id ─────────────────────────────────────────────────────
const getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('owner', 'name isVerifiedStudent email')
      .lean();

    if (!listing) {
      return errorResponse(res, 'Listing not found', 404);
    }

    // Non-admin users cannot see offMarket listings (unless they own it)
    const isOwner = req.user && String(listing.owner._id) === String(req.user._id);
    const isAdmin = req.user?.role === 'admin';

    if (listing.status === 'offMarket' && !isOwner && !isAdmin) {
      return errorResponse(res, 'This listing is no longer available', 404);
    }

    const isFavorited = req.user
      ? (await User.findById(req.user._id).select('favorites')).favorites
          .map(String)
          .includes(String(listing._id))
      : false;

    return successResponse(res, {
      ...listing,
      isFavorited,
      isOwnListing: isOwner,
      isBoosted: listing.boostedUntil && new Date(listing.boostedUntil) > new Date(),
    });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── POST /api/listings ────────────────────────────────────────────────────────
const createListing = async (req, res) => {
  try {
    const {
      title, description, price, bedrooms,
      petsAllowed, utilitiesIncluded,
      address, city, state, university,
      confirmedLat, confirmedLon,
    } = req.body;

    // Collect uploaded image URLs from Cloudinary (via multer middleware)
    const images = req.files?.map((f) => f.path) || [];
    if (images.length === 0) {
      return errorResponse(res, 'At least one image is required', 400);
    }

    // Use confirmed coordinates from frontend address verification, or fallback to geocoding
    let coordinates = { type: 'Point', coordinates: [0, 0] };
    let distanceToCampus = null;

    let coords = null;
    if (confirmedLat && confirmedLon) {
      coords = [parseFloat(confirmedLon), parseFloat(confirmedLat)];
    } else {
      coords = await geocodeAddress(address, city, state);
    }

    if (coords) {
      coordinates = { type: 'Point', coordinates: coords };
      const uni = await University.findOne({ name: new RegExp(university, 'i') });
      if (uni?.coordinates?.coordinates) {
        distanceToCampus = haversineDistance(coords, uni.coordinates.coordinates);
      }
    }

    const listing = await Listing.create({
      owner: req.user._id,
      title,
      description,
      price:             parseFloat(price),
      bedrooms:          parseInt(bedrooms),
      petsAllowed:       petsAllowed === 'true' || petsAllowed === true,
      utilitiesIncluded: utilitiesIncluded === 'true' || utilitiesIncluded === true,
      address,
      city,
      state:             state.toUpperCase(),
      university,
      coordinates,
      distanceToCampus,
      images,
    });

    await listing.populate('owner', 'name isVerifiedStudent');

    return successResponse(res, { listing }, 'Listing created successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── PUT /api/listings/:id ─────────────────────────────────────────────────────
const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return errorResponse(res, 'Listing not found', 404);

    // Only owner or admin can edit
    const isOwner = String(listing.owner) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to edit this listing', 403);
    }

    const allowed = [
      'title', 'description', 'price', 'bedrooms',
      'petsAllowed', 'utilitiesIncluded', 'address', 'city', 'state', 'university',
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) listing[field] = req.body[field];
    });

    // Re-geocode if address fields changed
    const addressChanged = ['address', 'city', 'state'].some(
      (f) => req.body[f] !== undefined
    );
    if (addressChanged) {
      const coords = await geocodeAddress(listing.address, listing.city, listing.state);
      if (coords) {
        listing.coordinates = { type: 'Point', coordinates: coords };
        const uni = await University.findOne({ name: new RegExp(listing.university, 'i') });
        if (uni?.coordinates?.coordinates) {
          listing.distanceToCampus = haversineDistance(coords, uni.coordinates.coordinates);
        }
      }
    }

    // Handle new images if uploaded
    if (req.files?.length > 0) {
      listing.images = [...listing.images, ...req.files.map((f) => f.path)];
    }

    await listing.save();
    return successResponse(res, { listing }, 'Listing updated');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── PATCH /api/listings/:id/status ───────────────────────────────────────────
// Owner can toggle: active ↔ pending
// Admin can set: active, pending, offMarket
const updateStatus = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return errorResponse(res, 'Listing not found', 404);

    const isOwner = String(listing.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'Not authorized', 403);
    }

    const { status } = req.body;

    // Validate status value
    if (!['active', 'pending', 'offMarket'].includes(status)) {
      return errorResponse(res, 'Invalid status value', 400);
    }

    // Admin reactivating an offMarket listing resets the expiry clock
    if (isAdmin && status === 'active' && listing.status === 'offMarket') {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 90);
      listing.expiresAt = expiry;
    }

    listing.status = status;
    await listing.save();

    // Update snapshot in all threads for this listing
    await Thread.updateMany(
      { listing: listing._id },
      { 'listingSnapshot.status': status }
    );

    // Broadcast to all connected clients so they update without refresh
    const io = req.app.get('io');
    if (io) {
      io.emit('listingStatusUpdated', { listingId: String(listing._id), status });
    }

    return successResponse(res, { status: listing.status }, 'Status updated');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── DELETE /api/listings/:id/image ───────────────────────────────────────────
// Remove a single image from a listing
const deleteImage = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return errorResponse(res, 'Listing not found', 404);

    const isOwner = String(listing.owner) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized', 403);
    }

    const { imageUrl } = req.body;
    if (listing.images.length <= 1) {
      return errorResponse(res, 'Cannot remove the last image', 400);
    }

    // Delete from Cloudinary
    const publicId = imageUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`letsmovnow/listings/${publicId}`);

    listing.images = listing.images.filter((img) => img !== imageUrl);
    await listing.save();

    return successResponse(res, { images: listing.images }, 'Image removed');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── DELETE /api/listings/:id ──────────────────────────────────────────────────
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return errorResponse(res, 'Listing not found', 404);

    const isOwner = String(listing.owner) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized', 403);
    }

    // Remove images from Cloudinary
    for (const imageUrl of listing.images) {
      try {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`letsmovnow/listings/${publicId}`);
      } catch { /* ignore individual image delete failures */ }
    }

    // Remove from all users' favorites
    await User.updateMany(
      { favorites: listing._id },
      { $pull: { favorites: listing._id } }
    );

    await listing.deleteOne();

    return successResponse(res, null, 'Listing deleted');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── POST /api/listings/:id/favorite ──────────────────────────────────────────
const toggleFavorite = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return errorResponse(res, 'Listing not found', 404);

    // Owners cannot favorite their own listing
    if (String(listing.owner) === String(req.user._id)) {
      return errorResponse(res, 'You cannot favorite your own listing', 400);
    }

    const user        = await User.findById(req.user._id);
    const isFavorited = user.favorites.map(String).includes(String(listing._id));

    if (isFavorited) {
      // Unfavorite
      user.favorites = user.favorites.filter(
        (id) => String(id) !== String(listing._id)
      );
      listing.favoriteCount = Math.max(0, listing.favoriteCount - 1);
    } else {
      // Favorite
      user.favorites.push(listing._id);
      listing.favoriteCount += 1;
    }

    await user.save();
    await listing.save();

    // Emit real-time update to listing owner (Socket.io — handled in server.js)
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${listing.owner}`).emit('favoriteCountUpdate', {
        listingId:     listing._id,
        favoriteCount: listing.favoriteCount,
      });
    }

    return successResponse(res, {
      isFavorited:   !isFavorited,
      favoriteCount: listing.favoriteCount,
    });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ── GET /api/listings/map ─────────────────────────────────────────────────────
// Lightweight endpoint for map pins — just coordinates and price
const getMapPins = async (req, res) => {
  try {
    const { state, city, university } = req.query;
    const filter = { status: { $in: ['active', 'pending'] } };

    if (state)      filter.state      = state.toUpperCase();
    if (city)       filter.city       = new RegExp(city, 'i');
    if (university) filter.university = new RegExp(university, 'i');

    const pins = await Listing.find(filter)
      .select('_id title price coordinates status images')
      .lean();

    return successResponse(res, { pins });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = {
  getListings,
  getMyListings,
  getListing,
  createListing,
  updateListing,
  updateStatus,
  deleteImage,
  deleteListing,
  toggleFavorite,
  getMapPins,
};
