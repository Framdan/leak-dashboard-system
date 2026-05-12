const Alert = require('../models/Alert');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../middleware/errorResponse');

// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Private
const getAlerts = asyncHandler(async (req, res, next) => {
  const query = {};
  
  if (req.query.acknowledged !== undefined) {
    query.acknowledged = req.query.acknowledged === 'true';
  }

  const alerts = await Alert.find(query).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: alerts });
});

// @desc    Acknowledge an alert
// @route   PUT /api/alerts/:id/acknowledge
// @access  Private
const acknowledgeAlert = asyncHandler(async (req, res, next) => {
  const alert = await Alert.findByIdAndUpdate(
    req.params.id,
    { acknowledged: true },
    { new: true, runValidators: true }
  );

  if (!alert) {
    return next(new ErrorResponse(`Alert not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({ success: true, data: alert });
});

module.exports = {
  getAlerts,
  acknowledgeAlert
};
