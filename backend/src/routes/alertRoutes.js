const express = require('express');
const router = express.Router();
const { getAlerts, acknowledgeAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

// All alert routes are protected
router.use(protect);

// @route   GET /api/alerts
// @desc    Get all alerts (supports ?acknowledged=true/false)
router.get('/', getAlerts);

// @route   PUT /api/alerts/:id/acknowledge
// @desc    Mark an alert as acknowledged
router.put('/:id/acknowledge', acknowledgeAlert);

module.exports = router;
