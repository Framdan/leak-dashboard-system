const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  resetSettings,
  getSystemStatus
} = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

router.route('/settings')
  .get(protect, getSettings)
  .put(protect, updateSettings);

router.post('/settings/reset', protect, resetSettings);
router.get('/system/status', protect, getSystemStatus);

module.exports = router;
