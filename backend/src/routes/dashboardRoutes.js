const express = require('express');
const router = express.Router();
const {
    getDashboardSummary
} = require('../controllers/dashboardController');
const {
    getAnalytics
} = require('../controllers/analyticsController');
const {
    getSystemHistory
} = require('../controllers/historyController');
const {
    protect
} = require('../middleware/authMiddleware');

// All dashboard routes are protected
router.get('/summary', protect, getDashboardSummary);
router.get('/analytics', protect, getAnalytics);
router.get('/history', protect, getSystemHistory);

module.exports = router;
