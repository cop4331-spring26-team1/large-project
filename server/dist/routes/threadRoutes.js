"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const threadController_1 = require("../controllers/threadController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/', auth_1.protect, threadController_1.getThreads);
router.get('/unread-count', auth_1.protect, threadController_1.getUnreadCount);
router.post('/', auth_1.protect, threadController_1.createThread);
router.get('/:id/messages', auth_1.protect, threadController_1.getMessages);
router.post('/:id/messages', auth_1.protect, threadController_1.sendMessage);
router.patch('/:id/block', auth_1.protect, threadController_1.blockThread);
router.patch('/:id/delete', auth_1.protect, threadController_1.deleteThread);
exports.default = router;
