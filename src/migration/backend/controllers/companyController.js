const Company = require('../models/Company');

const getCompanies = async (req, res) => {
  const companies = await Company.find({ created_by: req.user.email }).sort({ createdAt: -1 });
  res.json(companies);
};

const getCompany = async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) return res.status(404).json({ message: 'Company not found' });
  res.json(company);
};

const createCompany = async (req, res) => {
  const company = await Company.create({ ...req.body, created_by: req.user.email });
  res.status(201).json(company);
};

const updateCompany = async (req, res) => {
  const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!company) return res.status(404).json({ message: 'Company not found' });
  res.json(company);
};

const deleteCompany = async (req, res) => {
  const company = await Company.findByIdAndDelete(req.params.id);
  if (!company) return res.status(404).json({ message: 'Company not found' });
  res.json({ message: 'Company deleted' });
};

module.exports = { getCompanies, getCompany, createCompany, updateCompany, deleteCompany };