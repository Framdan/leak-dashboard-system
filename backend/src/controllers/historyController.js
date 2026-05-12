const PressureReading = require('../models/PressureReading');

/**
 * @desc    Get historical pressure readings for the system
 * @route   GET /api/dashboard/history
 * @access  Private
 */
const getSystemHistory = async (req, res) => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    // Aggregate readings for the system (averaging all nodes at each timestamp roughly, 
    // or just showing readings from a representative node. For simplicity, we'll average all nodes).
    const readings = await PressureReading.aggregate([
      { $match: { timestamp: { $gte: twoHoursAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%dT%H:%M:00Z", date: "$timestamp" } },
          avgPressure: { $avg: "$pressure" }
      }},
      { $sort: { "_id": 1 } }
    ]);

    const formattedData = readings.map(r => ({
      timestamp: new Date(r._id).getTime(),
      pressure: parseFloat(r.avgPressure.toFixed(2))
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error fetching system history:', error);
    res.status(500).json({ message: 'Server error while fetching history' });
  }
};

module.exports = {
  getSystemHistory
};
