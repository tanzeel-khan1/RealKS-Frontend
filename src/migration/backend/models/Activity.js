const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  action: { type: String, required: true },
  entity_type: { type: String },
  entity_id: { type: String },
  details: { type: String },
  old_value: { type: String },
  new_value: { type: String },
  user_name: { type: String },
  user_email: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);