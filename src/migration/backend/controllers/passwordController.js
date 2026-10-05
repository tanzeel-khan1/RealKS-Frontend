const Password = require('../models/Password');

const getPasswords = async (req, res) => {
  const passwords = await Password.find({ company_id: req.params.companyId }).sort({ createdAt: -1 });
  res.json(passwords);
};

const createPassword = async (req, res) => {
  const password = await Password.create({ ...req.body, company_id: req.params.companyId, created_by: req.user.email });
  res.status(201).json(password);
};

const updatePassword = async (req, res) => {
  const password = await Password.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!password) return res.status(404).json({ message: 'Password not found' });
  res.json(password);
};

const deletePassword = async (req, res) => {
  const password = await Password.findByIdAndDelete(req.params.id);
  if (!password) return res.status(404).json({ message: 'Password not found' });
  res.json({ message: 'Password deleted' });
};

module.exports = { getPasswords, createPassword, updatePassword, deletePassword };