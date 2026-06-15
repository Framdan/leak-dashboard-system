const PressureReading = require('../models/PressureReading');

/**
 * @desc    Get historical pressure readings for the live chart
 * @route   GET /api/dashboard/history
 * @access  Private
 *
 * Returns the last 120 individual readings averaged across all nodes per
 * timestamp bucket (10-second windows). This gives a smooth real-time chart
 * that updates visibly every time Wokwi or Python scripts post new data.
 */
const getSystemHistory = async (req, res) => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // Bucket by 10-second windows so each Wokwi reading (every 2s)
    // produces a visible chart update within seconds, not minutes.
    const readings = await PressureReading.aggregate([
      { $match: { timestamp: { $gte: twoHoursAgo } } },
      {
        $group: {
          // Round timestamp down to nearest 10-second bucket
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: '$timestamp' },
                { $mod: [{ $toLong: '$timestamp' }, 10000] }
              ]
            }
          },
          avgPressure: { $avg: '$pressure' },
          maxPressure: { $max: '$pressure' },
          minPressure: { $min: '$pressure' },
          count:       { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } },
      // Cap at 720 points (2hrs / 10s = 720) to keep payload small
      { $limit: 720 }
    ]);

    const formattedData = readings.map(r => ({
      timestamp: new Date(r._id).getTime(),
      pressure:  parseFloat(r.avgPressure.toFixed(2)),
      max:       parseFloat(r.maxPressure.toFixed(2)),
      min:       parseFloat(r.minPressure.toFixed(2)),
      count:     r.count
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error fetching system history:', error);
    res.status(500).json({ message: 'Server error while fetching history' });
  }
};

module.exports = { getSystemHistory };
