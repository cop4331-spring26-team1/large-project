import crypto from 'crypto';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/mailer';

const signToken = (userId: string, email: string, role: string, isEmailVerified: boolean): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET not set');
  return jwt.sign({ userId, email, role, isEmailVerified }, jwtSecret, { expiresIn: '7d' });
};

const serializeUser = (user: InstanceType<typeof User>) => ({
  _id:               user._id,
  name:              user.name,
  email:             user.email,
  role:              user.role,
  isAdmin:           user.isAdmin,
  isVerifiedStudent: user.isVerifiedStudent,
  isEmailVerified:   user.isEmailVerified,
  avatarKey:         user.avatarKey,
  favorites:         user.favorites,
});

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    const hashedPassword     = await bcrypt.hash(password, 10);
    const emailVerifyToken   = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      name,
      email:            email.toLowerCase(),
      hashedPassword,
      role:             'user',
      isEmailVerified:  false,
      emailVerifyToken,
      emailVerifyExpires,
    });

    await sendVerificationEmail(user.email, user.name, emailVerifyToken);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    if (user.isBlocked) {
      res.status(403).json({ error: 'Account is blocked' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.hashedPassword);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken(user._id.toString(), user.email, user.role, user.isEmailVerified);

    res.status(200).json({
      message: 'Login successful',
      data: {
        token,
        user: serializeUser(user),
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User
        .findById(req.userId)
        .select('-hashedPassword -emailVerifyToken -passwordResetToken')
        .populate('favorites');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(200).json({ data: user });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, avatarKey } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (name)      user.name      = name;
    if (avatarKey) user.avatarKey = avatarKey;
    await user.save();

    res.status(200).json({ data: { user: serializeUser(user) } });
  } catch (err) {
    console.error('updateMe error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerifyToken:   token,
      emailVerifyExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired verification link' });
      return;
    }

    user.isEmailVerified    = true;
    user.emailVerifyToken   = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    const authToken = signToken(user._id.toString(), user.email, user.role, user.isEmailVerified);

    res.status(200).json({
      message: 'Email verified successfully',
      data: {
        token: authToken,
        user:  serializeUser(user),
      },
    });
  } catch (err) {
    console.error('verifyEmail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.isEmailVerified) {
      res.status(200).json({ message: 'If that email exists, a verification link has been sent.' });
      return;
    }

    user.emailVerifyToken   = crypto.randomBytes(32).toString('hex');
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, user.name, user.emailVerifyToken);

    res.status(200).json({ message: 'If that email exists, a verification link has been sent.' });
  } catch (err) {
    console.error('resendVerification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
      return;
    }

    user.passwordResetToken   = crypto.randomBytes(32).toString('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(user.email, user.name, user.passwordResetToken);

    res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token }    = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      passwordResetToken:   token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired reset link' });
      return;
    }

    user.hashedPassword       = await bcrypt.hash(password, 10);
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};