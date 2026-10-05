const express = require('express');
const router = express.Router({ mergeParams: true });
const { getPasswords, createPassword, updatePassword, deletePassword } = require('../controllers/passwordController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', getPasswords);
router.post('/', createPassword);
router.put('/:id', updatePassword);
router.delete('/:id', deletePassword);

module.exports = router;