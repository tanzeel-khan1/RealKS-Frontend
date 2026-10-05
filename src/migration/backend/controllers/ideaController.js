const Idea = require('../models/Idea');
const IdeaComment = require('../models/IdeaComment');

const getIdeas = async (req, res) => {
  const ideas = await Idea.find({ company_id: req.params.companyId }).sort({ createdAt: -1 });
  res.json(ideas);
};

const createIdea = async (req, res) => {
  const idea = await Idea.create({ ...req.body, company_id: req.params.companyId, created_by: req.user.email });
  res.status(201).json(idea);
};

const updateIdea = async (req, res) => {
  const idea = await Idea.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!idea) return res.status(404).json({ message: 'Idea not found' });
  res.json(idea);
};

const deleteIdea = async (req, res) => {
  const idea = await Idea.findByIdAndDelete(req.params.id);
  if (!idea) return res.status(404).json({ message: 'Idea not found' });
  await IdeaComment.deleteMany({ idea_id: req.params.id });
  res.json({ message: 'Idea deleted' });
};

const getComments = async (req, res) => {
  const comments = await IdeaComment.find({ idea_id: req.params.ideaId }).sort({ createdAt: 1 });
  res.json(comments);
};

const addComment = async (req, res) => {
  const comment = await IdeaComment.create({ ...req.body, idea_id: req.params.ideaId, author_email: req.user.email });
  res.status(201).json(comment);
};

module.exports = { getIdeas, createIdea, updateIdea, deleteIdea, getComments, addComment };