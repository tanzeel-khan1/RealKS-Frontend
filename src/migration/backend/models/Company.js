const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logo_url: { type: String },
  industry: { type: String },
  country: { type: String },
  currency: { type: String, enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'PKR'], default: 'USD' },
  fiscal_year_start: { type: String },
  description: { type: String },
  setup_progress: { type: Number, default: 0 },
  total_revenue: { type: Number, default: 0 },
  total_expenses: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
  created_by: { type: String }, // user email
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);