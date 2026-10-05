const Investor = require('../models/Investor');

const getInvestors = async (req, res) => {
  const investors = await Investor.find({ company_id: req.params.companyId }).sort({ createdAt: -1 });
  res.json(investors);
};

const createInvestor = async (req, res) => {
  const investor = await Investor.create({ ...req.body, company_id: req.params.companyId, created_by: req.user.email });
  res.status(201).json(investor);
};

const updateInvestor = async (req, res) => {
  const investor = await Investor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!investor) return res.status(404).json({ message: 'Investor not found' });
  res.json(investor);
};

const deleteInvestor = async (req, res) => {
  const investor = await Investor.findByIdAndDelete(req.params.id);
  if (!investor) return res.status(404).json({ message: 'Investor not found' });
  res.json({ message: 'Investor deleted' });
};

module.exports = { getInvestors, createInvestor, updateInvestor, deleteInvestor };