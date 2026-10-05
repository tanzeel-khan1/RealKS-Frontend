const ChatMessage = require('../models/ChatMessage');

const getMessages = async (req, res) => {
  const messages = await ChatMessage.find({ company_id: req.params.roomId }).sort({ createdAt: 1 }).limit(200);
  res.json(messages);
};

const sendMessage = async (req, res) => {
  const message = await ChatMessage.create({ ...req.body, company_id: req.params.roomId, sender_email: req.user.email });
  res.status(201).json(message);
};

const deleteMessage = async (req, res) => {
  const message = await ChatMessage.findByIdAndDelete(req.params.id);
  if (!message) return res.status(404).json({ message: 'Message not found' });
  res.json({ message: 'Message deleted' });
};

module.exports = { getMessages, sendMessage, deleteMessage };