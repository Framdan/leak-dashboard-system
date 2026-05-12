const Node = require('../models/Node');
const Alert = require('../models/Alert');
const PressureReading = require('../models/PressureReading');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../middleware/errorResponse');

/**
 * @desc    Get dashboard summary statistics
 * @route   GET /api/dashboard/summary
 * @access  Private
 */
const getDashboardSummary = asyncHandler(async (req, res, next) => {
  const totalAlerts = await Alert.countDocuments({ acknowledged: false });

  // Use aggregation to get all stats in one query
  const stats = await Node.aggregate([
    {
      $lookup: {
        from: 'pressurereadings',
        let: { nodeId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$nodeId', '$$nodeId'] } } },
          { $sort: { timestamp: -1 } },
          { $limit: 1 }
        ],
        as: 'latestReading'
      }
    },
    {
      $addFields: {
        currentPressure: { $ifNull: [{ $arrayElemAt: ['$latestReading.pressure', 0] }, 0] },
        lastUpdate: { $arrayElemAt: ['$latestReading.timestamp', 0] }
      }
    },
    {
      $group: {
        _id: null,
        activeSensors: { $sum: 1 },
        totalPressure: { $sum: '$currentPressure' },
        totalMaop: { $sum: '$maop' },
        nodes: { $push: '$$ROOT' }
      }
    }
  ]);

  if (!stats || stats.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        activeSensors: 0,
        safeCount: 0,
        cautionCount: 0,
        warningCount: 0,
        offlineCount: 0,
        averagePressure: 0,
        averageMaop: 0,
        utilization: 0,
        totalAlerts
      }
    });
  }

  const result = stats[0];
  let safeCount = 0;
  let cautionCount = 0;
  let warningCount = 0;
  let offlineCount = 0;

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  result.nodes.forEach(node => {
    const ratio = node.maop > 0 ? node.currentPressure / node.maop : 0;
    if (ratio >= 0.85) warningCount++;
    else if (ratio >= 0.70) cautionCount++;
    else safeCount++;

    if (!node.lastUpdate || new Date(node.lastUpdate) < tenMinutesAgo) {
      offlineCount++;
    }
  });

  const averagePressure = result.activeSensors > 0 ? (result.totalPressure / result.activeSensors) : 0;
  const averageMaop = result.activeSensors > 0 ? (result.totalMaop / result.activeSensors) : 0;
  const utilization = averageMaop > 0 ? (averagePressure / averageMaop) * 100 : 0;

  res.status(200).json({
    success: true,
    data: {
      activeSensors: result.activeSensors,
      safeCount,
      cautionCount,
      warningCount,
      offlineCount,
      averagePressure: parseFloat(averagePressure.toFixed(2)),
      averageMaop: parseFloat(averageMaop.toFixed(2)),
      utilization: parseFloat(utilization.toFixed(1)),
      totalAlerts
    }
  });
});

module.exports = {
  getDashboardSummary
};
