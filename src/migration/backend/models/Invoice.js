const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: String,
  quantity: Number,
  unit_price: Number,
  total: Number,
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  invoice_number: { type: String },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  tax_amount: { type: Number, default: 0 },
  total_amount: { type: Number },
  recipient_name: { type: String },
  recipient_email: { type: String },
  due_date: { type: Date },
  status: { type: String, enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'archived'], default: 'draft' },
  items: [invoiceItemSchema],
  notes: { type: String },
  created_by: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);