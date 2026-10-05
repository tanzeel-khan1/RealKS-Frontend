const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  company_id: { type: String, required: true }, // can be a company id or a DM room key
  content: { type: String },
  sender_email: { type: String, required: true },
  sender_name: { type: String },
  is_read: { type: Boolean, default: false },
  image_url: { type: String },
  audio_url: { type: String },
  file_url: { type: String },
  file_name: { type: String },
  reply_to_id: { type: String },
  reply_to_content: { type: String },
  reply_to_sender: { type: String },
  reactions: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

chatMessageSchema.index({ company_id: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);