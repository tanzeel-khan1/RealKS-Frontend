const express = require('express');
const router = express.Router({ mergeParams: true });
const { getIdeas, createIdea, updateIdea, deleteIdea, getComments, addComment } = require('../controllers/ideaController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', getIdeas);
router.post('/', createIdea);
router.put('/:id', updateIdea);
router.delete('/:id', deleteIdea);

router.get('/:ideaId/comments', getComments);
router.post('/:ideaId/comments', addComment);

module.exports = router;