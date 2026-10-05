const Activity = require('../models/Activity');

const getActivities = async (req, res) => {
  const activities = await Activity.find({ company_id: req.params.companyId }).sort({ createdAt: -1 }).limit(100);
  res.json(activities);
};

const createActivity = async (req, res) => {
  const activity = await Activity.create({ ...req.body, company_id: req.params.companyId, user_email: req.user.email });
  res.status(201).json(activity);
};

module.exports = { getActivities, createActivity };