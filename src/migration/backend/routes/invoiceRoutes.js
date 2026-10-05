const express = require('express');
const router = express.Router({ mergeParams: true });
const { getInvoices, createInvoice, updateInvoice, deleteInvoice } = require('../controllers/invoiceController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', getInvoices);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

module.exports = router;