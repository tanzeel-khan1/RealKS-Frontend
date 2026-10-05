const express = require('express');
const router = express.Router({ mergeParams: true });
const { getNotes, createNote, updateNote, deleteNote } = require('../controllers/noteController');
const protect = require('../middleware/auth');

router.use(protect);

// Company notes: GET /api/companies/:companyId/notes
// Personal notes: GET /api/notes (no companyId param)
router.get('/', getNotes);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;