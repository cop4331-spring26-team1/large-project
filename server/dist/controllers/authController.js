"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.resendVerification = exports.verifyEmail = exports.updateMe = exports.getMe = exports.loginUser = exports.registerUser = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const mailer_1 = require("../lib/mailer");
const signToken = (userId, email, role, isEmailVerified, isVerifiedStudent) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret)
        throw new Error('JWT_SECRET not set');
    return jsonwebtoken_1.default.sign({ userId, email, role, isEmailVerified, isVerifiedStudent }, jwtSecret, { expiresIn: '7d' });
};
const serializeUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isAdmin: user.isAdmin,
    isVerifiedStudent: user.isVerifiedStudent,
    isEmailVerified: user.isEmailVerified,
    avatarKey: user.avatarKey,
    favorites: user.favorites,
});
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }
        const existingUser = await User_1.default.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(409).json({ error: 'User already exists' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const emailVerifyToken = crypto_1.default.randomBytes(32).toString('hex');
        const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const user = await User_1.default.create({
            name,
            email: email.toLowerCase(),
            hashedPassword,
            role: 'user',
            isEmailVerified: false,
            emailVerifyToken,
            emailVerifyExpires,
        });
        await (0, mailer_1.sendVerificationEmail)(user.email, user.name, emailVerifyToken);
        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
        });
    }
    catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const user = await User_1.default.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        if (user.isBlocked) {
            res.status(403).json({ error: 'Account is blocked' });
            return;
        }
        const validPassword = await bcryptjs_1.default.compare(password, user.hashedPassword);
        if (!validPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const token = signToken(user._id.toString(), user.email, user.role, user.isEmailVerified, user.isVerifiedStudent);
        res.status(200).json({
            message: 'Login successful',
            data: {
                token,
                user: serializeUser(user),
            },
        });
    }
    catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.loginUser = loginUser;
const getMe = async (req, res) => {
    try {
        const user = await User_1.default
            .findById(req.userId)
            .select('-hashedPassword -emailVerifyToken -passwordResetToken')
            .populate('favorites');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.status(200).json({ data: user });
    }
    catch (err) {
        console.error('getMe error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getMe = getMe;
const updateMe = async (req, res) => {
    try {
        const { name, avatarKey } = req.body;
        const user = await User_1.default.findById(req.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        if (name)
            user.name = name;
        if (avatarKey)
            user.avatarKey = avatarKey;
        await user.save();
        res.status(200).json({ data: { user: serializeUser(user) } });
    }
    catch (err) {
        console.error('updateMe error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.updateMe = updateMe;
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User_1.default.findOne({
            emailVerifyToken: token,
            emailVerifyExpires: { $gt: new Date() },
        });
        if (!user) {
            res.status(400).json({ error: 'Invalid or expired verification link' });
            return;
        }
        user.isEmailVerified = true;
        user.emailVerifyToken = undefined;
        user.emailVerifyExpires = undefined;
        await user.save();
        const authToken = signToken(user._id.toString(), user.email, user.role, user.isEmailVerified, user.isVerifiedStudent);
        res.status(200).json({
            message: 'Email verified successfully',
            data: {
                token: authToken,
                user: serializeUser(user),
            },
        });
    }
    catch (err) {
        console.error('verifyEmail error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.verifyEmail = verifyEmail;
const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User_1.default.findOne({ email: email.toLowerCase() });
        if (!user || user.isEmailVerified) {
            res.status(200).json({ message: 'If that email exists, a verification link has been sent.' });
            return;
        }
        user.emailVerifyToken = crypto_1.default.randomBytes(32).toString('hex');
        user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();
        await (0, mailer_1.sendVerificationEmail)(user.email, user.name, user.emailVerifyToken);
        res.status(200).json({ message: 'If that email exists, a verification link has been sent.' });
    }
    catch (err) {
        console.error('resendVerification error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.resendVerification = resendVerification;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User_1.default.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
            return;
        }
        user.passwordResetToken = crypto_1.default.randomBytes(32).toString('hex');
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();
        await (0, mailer_1.sendPasswordResetEmail)(user.email, user.name, user.passwordResetToken);
        res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }
    catch (err) {
        console.error('forgotPassword error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const user = await User_1.default.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() },
        });
        if (!user) {
            res.status(400).json({ error: 'Invalid or expired reset link' });
            return;
        }
        user.hashedPassword = await bcryptjs_1.default.hash(password, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        res.status(200).json({ message: 'Password reset successfully' });
    }
    catch (err) {
        console.error('resetPassword error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.resetPassword = resetPassword;
