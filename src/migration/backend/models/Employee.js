const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  email: { type: String },
  role: { type: String },
  salary: { type: Number },
  hire_date: { type: Date },
  date_of_birth: { type: Date },
  offer_letter_url: { type: String },
  nic_image_url: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'terminated'], default: 'active' },
  created_by: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);