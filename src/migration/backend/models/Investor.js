const mongoose = require('mongoose');

const investorSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  user_email: { type: String },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ['owner', 'admin', 'investor', 'finance_manager', 'accountant', 'auditor', 'viewer'],
    default: 'investor'
  },
  equity_percentage: { type: Number, default: 0 },
  total_invested: { type: Number, default: 0 },
  total_withdrawn: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'invited', 'inactive'], default: 'active' },
  created_by: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Investor', investorSchema);