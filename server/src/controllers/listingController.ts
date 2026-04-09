import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Listing from '../models/Listing';
import {uploadImage, deleteImage as deleteCloudinaryImage} from "../lib/cloudinary";

export const getListings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { state, city, university, minPrice, maxPrice, bedrooms, petsAllowed, utilitiesIncluded, sortBy, page = 1 } = req.query;
        const filter: any = { status: 'active' };

        if (state)              filter.state = state;
        if (city)               filter.city = city;
        if (university)         filter.university = university;
        if (petsAllowed)        filter.petsAllowed = petsAllowed === 'true';
        if (utilitiesIncluded)  filter.utilitiesIncluded = utilitiesIncluded === 'true';
        if (bedrooms)           filter.bedrooms = Number(bedrooms);
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        const sortOptions: any = {
            newest:       { createdAt: -1 },
            price_asc:    { price: 1 },
            price_desc:   { price: -1 },
        };
        const sort = sortOptions[sortBy as string] || { createdAt: -1 };

        const limit = 12;
        const skip  = (Number(page) - 1) * limit;

        const [items, total] = await Promise.all([
            Listing.find(filter).populate('owner', 'name isVerifiedStudent').sort(sort).skip(skip).limit(limit),
            Listing.countDocuments(filter),
        ]);

        res.status(200).json({
            data: {
                listings: items,
                pagination: {
                    total,
                    page:       Number(page),
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (err) {
        console.error('getListings error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getMine = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const listings = await Listing.find({ owner: req.userId }).sort({ createdAt: -1 });
        res.status(200).json({ data: { listings } });
    } catch (err) {
        console.error('getMine error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getMapPins = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const listings = await Listing.find({ status: 'active' }, '_id title price status images coordinates');
        res.status(200).json({ items: listings });
    } catch (err) {
        console.error('getMapPins error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const listing = await Listing.findById(req.params.id).populate('owner', 'name isVerifiedStudent email');
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        res.status(200).json({ data: listing });
    } catch (err) {
        console.error('getById error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createListing = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            title, description, price, bedrooms,
            petsAllowed, utilitiesIncluded, address,
            city, state, university,
            lat, lon,
        } = req.body;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 60);

        const files = req.files as Express.Multer.File[];
        const imageUrls: string[] = [];
        if (files && files.length > 0) {
            for (const file of files) {
                const url = await uploadImage(file.buffer, 'listings');
                imageUrls.push(url);
            }
        }

        const listing = await Listing.create({
            owner:             req.userId,
            title,
            description,
            price:             Number(price),
            bedrooms:          Number(bedrooms),
            petsAllowed:       petsAllowed === 'true',
            utilitiesIncluded: utilitiesIncluded === 'true',
            address,
            city,
            state,
            university,
            coordinates: {
                type:        'Point',
                coordinates: [Number(lon) || 0, Number(lat) || 0],
            },
            images:   imageUrls,
            expiresAt,
        });

        res.status(201).json({ data: listing });
    } catch (err) {
        console.error('createListing error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateListing = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        if (listing.owner.toString() !== req.userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const {
            title, description, price, bedrooms,
            petsAllowed, utilitiesIncluded, address,
            city, state, university, lat, lon,
        } = req.body;

        const files = req.files as Express.Multer.File[];
        if (files && files.length > 0) {
            for (const file of files) {
                const url = await uploadImage(file.buffer, 'listings');
                listing.images.push(url);
            }
        }

        listing.title             = title             ?? listing.title;
        listing.description       = description       ?? listing.description;
        listing.price             = price             ? Number(price) : listing.price;
        listing.bedrooms          = bedrooms          ? Number(bedrooms) : listing.bedrooms;
        listing.petsAllowed       = petsAllowed       !== undefined ? petsAllowed === 'true' : listing.petsAllowed;
        listing.utilitiesIncluded = utilitiesIncluded !== undefined ? utilitiesIncluded === 'true' : listing.utilitiesIncluded;
        listing.address           = address           ?? listing.address;
        listing.city              = city              ?? listing.city;
        listing.state             = state             ?? listing.state;
        listing.university        = university        ?? listing.university;
        if (lat && lon) {
            listing.coordinates = {
                type:        'Point',
                coordinates: [Number(lon), Number(lat)],
            };
        }

        await listing.save();
        res.status(200).json({ data: listing });
    } catch (err) {
        console.error('updateListing error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const listing = await Listing.findById(req.params.id);
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
    } catch (err) {
        console.error('updateStatus error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};


export const toggleFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }

        const User = (await import('../models/User')).default;
        const user = await User.findById(req.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const alreadyFavorited = user.favorites.some((f: any) => f.toString() === listing._id.toString());

        if (alreadyFavorited) {
            user.favorites  = user.favorites.filter((f: any) => f.toString() !== listing._id.toString());
            listing.favoriteCount = Math.max(0, listing.favoriteCount - 1);
        } else {
            user.favorites.push(listing._id as any);
            listing.favoriteCount += 1;
        }

        await Promise.all([user.save(), listing.save()]);
        res.status(200).json({ isFavorited: !alreadyFavorited, favoriteCount: listing.favoriteCount });
    } catch (err) {
        console.error('toggleFavorite error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const deleteListing = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const listing = await Listing.findById(req.params.id);
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
    } catch (err) {
        console.error('deleteListing error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// DELETE /api/listings/:id/image
export const deleteListingImage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        if (listing.owner.toString() !== req.userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const { imageUrl } = req.body;
        await deleteCloudinaryImage(imageUrl);
        listing.images = listing.images.filter((img) => img !== imageUrl);
        await listing.save();

        res.status(200).json({ data: listing });
    } catch (err) {
        console.error('deleteListingImage error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};