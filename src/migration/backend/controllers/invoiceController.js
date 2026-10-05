const Invoice = require('../models/Invoice');

const getInvoices = async (req, res) => {
  const invoices = await Invoice.find({ company_id: req.params.companyId }).sort({ createdAt: -1 });
  res.json(invoices);
};

const createInvoice = async (req, res) => {
  const invoice = await Invoice.create({ ...req.body, company_id: req.params.companyId, created_by: req.user.email });
  res.status(201).json(invoice);
};

const updateInvoice = async (req, res) => {
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  res.json(invoice);
};

const deleteInvoice = async (req, res) => {
  const invoice = await Invoice.findByIdAndDelete(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  res.json({ message: 'Invoice deleted' });
};

module.exports = { getInvoices, createInvoice, updateInvoice, deleteInvoice };