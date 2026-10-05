const express = require('express');
const router = express.Router();
const { getCompanies, getCompany, createCompany, updateCompany, deleteCompany } = require('../controllers/companyController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', getCompanies);
router.post('/', createCompany);
router.get('/:id', getCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

module.exports = router;