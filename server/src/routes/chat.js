const express = require('express');
const router  = express.Router();

const {
  createThread,
  getThreads,
  getMessages,
  sendMessage,
  blockThread,
  deleteThread,
  getUnreadCount,
} = require('../controllers/chatController');

const { protect }      = require('../middleware/auth');
const { messageRules, validate } = require('../middleware/validate');

router.use(protect); // all chat routes require auth

router.get( '/',                   getThreads);
router.get( '/unread-count',       getUnreadCount);
router.post('/',                   createThread);
router.get( '/:id/messages',       getMessages);
router.post('/:id/messages',       messageRules, validate, sendMessage);
router.patch('/:id/block',         blockThread);
router.patch('/:id/delete',        deleteThread);

module.exports = router;
