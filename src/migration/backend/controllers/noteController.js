const Note = require('../models/Note');

const getNotes = async (req, res) => {
  const filter = req.params.companyId
    ? { company_id: req.params.companyId }
    : { is_personal: true, created_by: req.user.email };
  const notes = await Note.find(filter).sort({ createdAt: -1 });
  res.json(notes);
};

const createNote = async (req, res) => {
  const note = await Note.create({ ...req.body, created_by: req.user.email });
  res.status(201).json(note);
};

const updateNote = async (req, res) => {
  const note = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.json(note);
};

const deleteNote = async (req, res) => {
  const note = await Note.findByIdAndDelete(req.params.id);
  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.json({ message: 'Note deleted' });
};

module.exports = { getNotes, createNote, updateNote, deleteNote };