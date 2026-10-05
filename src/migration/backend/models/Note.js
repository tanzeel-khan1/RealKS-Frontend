const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  is_personal: { type: Boolean, default: false },
  color: { type: String, enum: ['yellow', 'blue', 'green', 'pink', 'purple', 'white'], default: 'yellow' },
  cover_image_url: { type: String },
  images: [{ type: String }],
  created_by: { type: String },
  created_by_name: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);