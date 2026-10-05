const express = require('express');
const router = express.Router({ mergeParams: true });
const { getInvestors, createInvestor, updateInvestor, deleteInvestor } = require('../controllers/investorController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', getInvestors);
router.post('/', createInvestor);
router.put('/:id', updateInvestor);
router.delete('/:id', deleteInvestor);

module.exports = router;