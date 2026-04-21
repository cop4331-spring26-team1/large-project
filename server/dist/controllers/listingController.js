"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteListingImage = exports.deleteListing = exports.toggleFavorite = exports.updateStatus = exports.updateListing = exports.createListing = exports.getById = exports.getMapPins = exports.getMine = exports.getListings = void 0;
const Listing_1 = __importDefault(require("../models/Listing"));
const User_1 = __importDefault(require("../models/User"));
const University_1 = __importDefault(require("../models/University"));
const cloudinary_1 = require("../lib/cloudinary");
function haversineMiles([lng1, lat1], [lng2, lat2]) {
    const R = 3958.8;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
const getListings = async (req, res) => {
    try {
        const { state, city, university, minPrice, maxPrice, bedrooms, petsAllowed, utilitiesIncluded, sortBy, page = 1, lat, lon, } = req.query;
        const filter = { status: 'active' };
        if (state)
            filter.state = state;
        if (city)
            filter.city = city;
        if (university)
            filter.university = university;
        if (petsAllowed)
            filter.petsAllowed = petsAllowed === 'true';
        if (utilitiesIncluded)
            filter.utilitiesIncluded = utilitiesIncluded === 'true';
        if (bedrooms)
            filter.bedrooms = Number(bedrooms);
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice)
                filter.price.$gte = Number(minPrice);
            if (maxPrice)
                filter.price.$lte = Number(maxPrice);
        }
        const isDistanceSort = sortBy === 'distance_asc' || sortBy === 'distance_desc';
        const userLat = lat ? Number(lat) : null;
        const userLon = lon ? Number(lon) : null;
        const sortOptions = {
            newest: { createdAt: -1 },
            price_asc: { price: 1 },
            price_desc: { price: -1 },
        };
        const sort = isDistanceSort
            ? { createdAt: -1 }
            : (sortOptions[sortBy] || { createdAt: -1 });
        const limit = 12;
        const skip = (Number(page) - 1) * limit;
        const [items, total] = await Promise.all([
            Listing_1.default.find(filter)
                .populate('owner', 'name isVerifiedStudent')
                .sort(sort)
                .skip(skip)
                .limit(limit),
            Listing_1.default.countDocuments(filter),
        ]);
        let sorted = [...items];
        if (isDistanceSort && userLat !== null && userLon !== null) {
            sorted.sort((a, b) => {
                const distA = haversineMiles([userLon, userLat], a.coordinates.coordinates);
                const distB = haversineMiles([userLon, userLat], b.coordinates.coordinates);
                return sortBy === 'distance_asc' ? distA - distB : distB - distA;
            });
        }
        const currentPage = Number(page);
        res.status(200).json({
            data: {
                listings: sorted,
                pagination: {
                    total,
                    page: currentPage,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    hasMore: currentPage * limit < total,
                },
            },
        });
    }
    catch (err) {
        console.error('getListings error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getListings = getListings;
const getMine = async (req, res) => {
    try {
        const listings = await Listing_1.default.find({ owner: req.userId }).sort({ createdAt: -1 });
        res.status(200).json({ data: { listings } });
    }
    catch (err) {
        console.error('getMine error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getMine = getMine;
const getMapPins = async (req, res) => {
    try {
        const { state, city, university, minPrice, maxPrice, bedrooms, petsAllowed, utilitiesIncluded } = req.query;
        const filter = { status: 'active' };
        if (state)
            filter.state = state;
        if (city)
            filter.city = city;
        if (university)
            filter.university = university;
        if (petsAllowed)
            filter.petsAllowed = petsAllowed === 'true';
        if (utilitiesIncluded)
            filter.utilitiesIncluded = utilitiesIncluded === 'true';
        if (bedrooms)
            filter.bedrooms = Number(bedrooms);
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice)
                filter.price.$gte = Number(minPrice);
            if (maxPrice)
                filter.price.$lte = Number(maxPrice);
        }
        const listings = await Listing_1.default.find(filter, '_id title price status images coordinates');
        res.status(200).json({ data: { pins: listings } });
    }
    catch (err) {
        console.error('getMapPins error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getMapPins = getMapPins;
const getById = async (req, res) => {
    try {
        const listing = await Listing_1.default.findById(req.params.id).populate('owner', 'name isVerifiedStudent email');
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        res.status(200).json({ data: listing });
    }
    catch (err) {
        console.error('getById error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getById = getById;
const createListing = async (req, res) => {
    try {
        if (!req.isVerifiedStudent && req.userRole !== 'admin') {
            res.status(403).json({ error: 'Only verified students can create listings.' });
            return;
        }
        const { title, description, price, bedrooms, petsAllowed, utilitiesIncluded, address, city, state, university, confirmedLat, confirmedLon, } = req.body;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 60);
        const files = req.files;
        const imageUrls = [];
        if (files && files.length > 0) {
            for (const file of files) {
                const url = await (0, cloudinary_1.uploadImage)(file.buffer, 'listings');
                imageUrls.push(url);
            }
        }
        const lat = Number(confirmedLat) || 0;
        const lon = Number(confirmedLon) || 0;
        let distanceToCampus = null;
        if (lat && lon && university) {
            const uni = await University_1.default.findOne({ name: university });
            if (uni && uni.coordinates?.coordinates?.length === 2) {
                distanceToCampus = parseFloat(haversineMiles([lon, lat], uni.coordinates.coordinates).toFixed(1));
            }
        }
        const listing = await Listing_1.default.create({
            owner: req.userId,
            title,
            description,
            price: Number(price),
            bedrooms: Number(bedrooms),
            petsAllowed: petsAllowed === 'true',
            utilitiesIncluded: utilitiesIncluded === 'true',
            address,
            city,
            state,
            university,
            coordinates: {
                type: 'Point',
                coordinates: [lon, lat],
            },
            distanceToCampus,
            images: imageUrls,
            expiresAt,
        });
        res.status(201).json({ data: listing });
    }
    catch (err) {
        console.error('createListing error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.createListing = createListing;
const updateListing = async (req, res) => {
    try {
        if (!req.isVerifiedStudent && req.userRole !== 'admin') {
            res.status(403).json({ error: 'Only verified students can edit listings.' });
            return;
        }
        const listing = await Listing_1.default.findById(req.params.id);
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        if (listing.owner.toString() !== req.userId && req.userRole !== 'admin') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const { title, description, price, bedrooms, petsAllowed, utilitiesIncluded, address, city, state, university, confirmedLat, confirmedLon, } = req.body;
        const files = req.files;
        if (files && files.length > 0) {
            for (const file of files) {
                const url = await (0, cloudinary_1.uploadImage)(file.buffer, 'listings');
                listing.images.push(url);
            }
        }
        listing.title = title ?? listing.title;
        listing.description = description ?? listing.description;
        listing.price = price ? Number(price) : listing.price;
        listing.bedrooms = bedrooms ? Number(bedrooms) : listing.bedrooms;
        listing.petsAllowed = petsAllowed !== undefined ? petsAllowed === 'true' : listing.petsAllowed;
        listing.utilitiesIncluded = utilitiesIncluded !== undefined ? utilitiesIncluded === 'true' : listing.utilitiesIncluded;
        listing.address = address ?? listing.address;
        listing.city = city ?? listing.city;
        listing.state = state ?? listing.state;
        listing.university = university ?? listing.university;
        if (confirmedLat && confirmedLon) {
            const lat = Number(confirmedLat);
            const lon = Number(confirmedLon);
            listing.coordinates = { type: 'Point', coordinates: [lon, lat] };
            const uniName = university ?? listing.university;
            const uni = await University_1.default.findOne({ name: uniName });
            if (uni && uni.coordinates?.coordinates?.length === 2) {
                listing.distanceToCampus = parseFloat(haversineMiles([lon, lat], uni.coordinates.coordinates).toFixed(1));
            }
        }
        await listing.save();
        res.status(200).json({ data: listing });
    }
    catch (err) {
        console.error('updateListing error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.updateListing = updateListing;
const updateStatus = async (req, res) => {
    try {
        const listing = await Listing_1.default.findById(req.params.id);
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        if (listing.owner.toString() !== req.userId && req.userRole !== 'admin') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        listing.status = req.body.status;
        await listing.save();
        res.status(200).json({ data: listing });
    }
    catch (err) {
        console.error('updateStatus error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.updateStatus = updateStatus;
const toggleFavorite = async (req, res) => {
    try {
        const listing = await Listing_1.default.findById(req.params.id);
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        const user = await User_1.default.findById(req.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const alreadyFavorited = user.favorites.some((f) => f.toString() === listing._id.toString());
        if (alreadyFavorited) {
            user.favorites = user.favorites.filter((f) => f.toString() !== listing._id.toString());
            listing.favoriteCount = Math.max(0, listing.favoriteCount - 1);
        }
        else {
            user.favorites.push(listing._id);
            listing.favoriteCount += 1;
        }
        await Promise.all([user.save(), listing.save()]);
        res.status(200).json({ data: { isFavorited: !alreadyFavorited, favoriteCount: listing.favoriteCount } });
    }
    catch (err) {
        console.error('toggleFavorite error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.toggleFavorite = toggleFavorite;
const deleteListing = async (req, res) => {
    try {
        const listing = await Listing_1.default.findById(req.params.id);
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        if (listing.owner.toString() !== req.userId && req.userRole !== 'admin') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        await listing.deleteOne();
        res.status(200).json({ message: 'Listing deleted' });
    }
    catch (err) {
        console.error('deleteListing error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.deleteListing = deleteListing;
const deleteListingImage = async (req, res) => {
    try {
        const listing = await Listing_1.default.findById(req.params.id);
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        if (listing.owner.toString() !== req.userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const { imageUrl } = req.body;
        await (0, cloudinary_1.deleteImage)(imageUrl);
        listing.images = listing.images.filter((img) => img !== imageUrl);
        await listing.save();
        res.status(200).json({ data: listing });
    }
    catch (err) {
        console.error('deleteListingImage error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.deleteListingImage = deleteListingImage;
