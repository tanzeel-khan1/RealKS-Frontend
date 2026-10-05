const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getSections, createSection, deleteSection,
  getDocuments, createDocument, updateDocument, deleteDocument
} = require('../controllers/documentController');
const protect = require('../middleware/auth');

router.use(protect);

// Sections (nested under company)
router.get('/sections', getSections);
router.post('/sections', createSection);
router.delete('/sections/:id', deleteSection);

// Documents
router.get('/', getDocuments);
router.post('/', createDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

module.exports = router;