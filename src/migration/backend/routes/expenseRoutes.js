const express = require('express');
const router = express.Router({ mergeParams: true });
const { getExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;