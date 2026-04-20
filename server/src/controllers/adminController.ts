import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Listing from '../models/Listing';

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

export const getUsersAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 20), 100);
    const skip = (page - 1) * limit;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-hashedPassword -emailVerifyToken -passwordResetToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('getUsersAdmin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateUserAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const nextIsBlocked =
      typeof req.body.isBlocked === 'boolean' ? req.body.isBlocked : undefined;
    const nextRole =
      req.body.role === 'user' || req.body.role === 'admin' ? req.body.role : undefined;

    if (nextIsBlocked === undefined && nextRole === undefined) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    if (req.userId && user._id.toString() === req.userId) {
      if (nextIsBlocked === true) {
        res.status(400).json({ error: 'You cannot block your own account' });
        return;
      }
      if (nextRole === 'user') {
        res.status(400).json({ error: 'You cannot remove your own admin role' });
        return;
      }
    }

    if (nextIsBlocked !== undefined) user.isBlocked = nextIsBlocked;
    if (nextRole !== undefined) user.role = nextRole;

    await user.save();

    res.status(200).json({
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isBlocked: user.isBlocked,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (err) {
    console.error('updateUserAdmin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getListingsAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 20), 100);
    const skip = (page - 1) * limit;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { university: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Listing.countDocuments(filter),
    ]);

    res.status(200).json({
      data: {
        listings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('getListingsAdmin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteListingAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    await listing.deleteOne();
    res.status(200).json({ message: 'Listing deleted' });
  } catch (err) {
    console.error('deleteListingAdmin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
