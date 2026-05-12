const Node = require('../models/Node');
const PressureReading = require('../models/PressureReading');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Get analytics data for charts and metrics
 * @route   GET /api/dashboard/analytics
 * @access  Private
 */
const getAnalytics = asyncHandler(async (req, res, next) => {
  const { range = '24h' } = req.query;
  
  // Determine time range
  let since = new Date();
  if (range === '24h') since.setHours(since.getHours() - 24);
  else if (range === '7d') since.setDate(since.getDate() - 7);
  else if (range === '30d') since.setDate(since.getDate() - 30);
  else since.setHours(since.getHours() - 24);

  const nodes = await Node.find({});
  
  // 1. Calculate Status Distribution
  let safeCount = 0;
  let cautionCount = 0;
  let warningCount = 0;
  
  // 2. Node Utilization Data
  const utilizationData = [];
  
  // 3. Overall metrics
  let totalPressureSum = 0;
  let peakPressureValue = 0;
  let totalReadingCount = 0;

  for (const node of nodes) {
    const readings = await PressureReading.find({
      nodeId: node._id,
      timestamp: { $gte: since }
    }).sort({ timestamp: 1 });

    const latestReading = readings[readings.length - 1];
    const pressure = latestReading ? latestReading.pressure : 0;
    const maop = node.maop || 100;
    const utilization = (pressure / maop) * 100;

    // Status logic
    const ratio = pressure / maop;
    if (ratio >= 0.85) warningCount++;
    else if (ratio >= 0.70) cautionCount++;
    else safeCount++;

    utilizationData.push({
      name: node.name,
      value: parseFloat(utilization.toFixed(1))
    });

    // Aggregate metrics
    readings.forEach(r => {
      totalPressureSum += r.pressure;
      if (r.pressure > peakPressureValue) peakPressureValue = r.pressure;
      totalReadingCount++;
    });
  }

  const avgPressure = totalReadingCount > 0 ? (totalPressureSum / totalReadingCount) : 0;

  const statusData = [
    { name: "Safe", value: safeCount, color: "#10b981" },
    { name: "Caution", value: cautionCount, color: "#f59e0b" },
    { name: "Warning", value: warningCount, color: "#ef4444" },
  ];

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        averagePressure: `${avgPressure.toFixed(2)} PSI`,
        peakPressure: `${peakPressureValue.toFixed(2)} PSI`,
        averageUtilization: `${(nodes.length > 0 ? utilizationData.reduce((acc, curr) => acc + curr.value, 0) / nodes.length : 0).toFixed(1)}%`
      },
      statusData,
      utilizationData
    }
  });
});

module.exports = {
  getAnalytics
};
