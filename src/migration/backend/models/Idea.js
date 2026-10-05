const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['new', 'in_progress', 'on_hold', 'done', 'cancelled'], default: 'new' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  tags: [{ type: String }],
  assigned_to: { type: String },
  created_by: { type: String },
  created_by_name: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Idea', ideaSchema);