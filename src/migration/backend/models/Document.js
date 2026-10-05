const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  section_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DocSection', default: null },
  title: { type: String, required: true },
  file_url: { type: String },
  file_type: { type: String },
  file_size: { type: Number },
  category: {
    type: String,
    enum: ['legal', 'finance', 'contracts', 'hr', 'investments', 'tax', 'personal'],
    default: 'legal'
  },
  tags: [{ type: String }],
  is_personal: { type: Boolean, default: false },
  signed: { type: Boolean, default: false },
  signed_by: [{ type: String }],
  created_by: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);