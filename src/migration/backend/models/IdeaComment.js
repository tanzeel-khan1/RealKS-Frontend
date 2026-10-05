const mongoose = require('mongoose');

const ideaCommentSchema = new mongoose.Schema({
  idea_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  content: { type: String, required: true },
  author_name: { type: String },
  author_email: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('IdeaComment', ideaCommentSchema);