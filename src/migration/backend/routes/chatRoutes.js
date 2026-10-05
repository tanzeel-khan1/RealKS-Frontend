const express = require('express');
const router = express.Router({ mergeParams: true });
const { getMessages, sendMessage, deleteMessage } = require('../controllers/chatController');
const protect = require('../middleware/auth');

router.use(protect);

// Room = company_id used as roomId
router.get('/:roomId/messages', getMessages);
router.post('/:roomId/messages', sendMessage);
router.delete('/messages/:id', deleteMessage);

module.exports = router;