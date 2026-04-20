import express from 'express';
import {
    registerUser,
    loginUser,
    getMe,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    updateMe,
} from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/register',                registerUser);
router.post('/login',                   loginUser);
router.get('/me',                       protect, getMe);
router.get('/verify/:token',            verifyEmail);
router.post('/resend-verification',     resendVerification);
router.post('/forgot-password',         forgotPassword);
router.post('/reset-password/:token',   resetPassword);
router.put('/me', protect, updateMe);

export default router;