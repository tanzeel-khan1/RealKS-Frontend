const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// POST /api/auth/register
const register = async (req, res) => {
  const { full_name, email, password, role } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already registered' });

  const user = await User.create({ full_name, email, password, role });
  res.status(201).json({ ...user.toJSON(), token: generateToken(user._id) });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({ ...user.toJSON(), token: generateToken(user._id) });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { register, login, getMe };