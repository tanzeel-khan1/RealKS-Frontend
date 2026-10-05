const Employee = require('../models/Employee');

const getEmployees = async (req, res) => {
  const employees = await Employee.find({ company_id: req.params.companyId }).sort({ createdAt: -1 });
  res.json(employees);
};

const createEmployee = async (req, res) => {
  const employee = await Employee.create({ ...req.body, company_id: req.params.companyId, created_by: req.user.email });
  res.status(201).json(employee);
};

const updateEmployee = async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!employee) return res.status(404).json({ message: 'Employee not found' });
  res.json(employee);
};

const deleteEmployee = async (req, res) => {
  const employee = await Employee.findByIdAndDelete(req.params.id);
  if (!employee) return res.status(404).json({ message: 'Employee not found' });
  res.json({ message: 'Employee deleted' });
};

module.exports = { getEmployees, createEmployee, updateEmployee, deleteEmployee };