const Expense = require('../models/Expense');

const getExpenses = async (req, res) => {
  const expenses = await Expense.find({ company_id: req.params.companyId }).sort({ createdAt: -1 });
  res.json(expenses);
};

const createExpense = async (req, res) => {
  const expense = await Expense.create({ ...req.body, company_id: req.params.companyId, created_by: req.user.email });
  res.status(201).json(expense);
};

const updateExpense = async (req, res) => {
  const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  res.json(expense);
};

const deleteExpense = async (req, res) => {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  res.json({ message: 'Expense deleted' });
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };