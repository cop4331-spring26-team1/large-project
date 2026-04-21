"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/register', authController_1.registerUser);
router.post('/login', authController_1.loginUser);
router.get('/me', auth_1.protect, authController_1.getMe);
router.get('/verify/:token', authController_1.verifyEmail);
router.post('/resend-verification', authController_1.resendVerification);
router.post('/forgot-password', authController_1.forgotPassword);
router.post('/reset-password/:token', authController_1.resetPassword);
router.put('/me', auth_1.protect, authController_1.updateMe);
exports.default = router;
