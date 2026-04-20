import express from 'express';
import {
    getThreads,
    getUnreadCount,
    createThread,
    getMessages,
    sendMessage,
    blockThread,
    deleteThread,
} from '../controllers/threadController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/',                   protect, getThreads);
router.get('/unread-count',       protect, getUnreadCount);
router.post('/',                  protect, createThread);
router.get('/:id/messages',       protect, getMessages);
router.post('/:id/messages',      protect, sendMessage);
router.patch('/:id/block',        protect, blockThread);
router.patch('/:id/delete',       protect, deleteThread);

export default router;