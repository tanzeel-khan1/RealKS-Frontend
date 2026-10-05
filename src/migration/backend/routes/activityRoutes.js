const express = require('express');
const router = express.Router({ mergeParams: true });
const { getActivities, createActivity } = require('../controllers/activityController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', getActivities);
router.post('/', createActivity);

module.exports = router;