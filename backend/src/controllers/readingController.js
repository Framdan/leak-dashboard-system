const Node = require('../models/Node');
const PressureReading = require('../models/PressureReading');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../middleware/errorResponse');
const { evaluateNodeReading } = require('./alertController');

// @desc    Ingest a pressure reading for a node
// @route   POST /api/readings
// @access  Private
const createPressureReading = asyncHandler(async (req, res, next) => {
  const { nodeId, pressure, timestamp } = req.body;
  const deviceId = req.body.deviceId ? String(req.body.deviceId).trim().toLowerCase() : undefined;

  if (!nodeId && !deviceId) {
    return next(new ErrorResponse('nodeId or deviceId is required', 400));
  }

  const parsedPressure = Number(pressure);
  if (!Number.isFinite(parsedPressure) || parsedPressure < 0) {
    return next(new ErrorResponse('pressure must be a valid non-negative number', 400));
  }

  const node = nodeId ? await Node.findById(nodeId) : await Node.findOne({ deviceId });
  if (!node) {
    return next(new ErrorResponse(nodeId ? `Node not found with id of ${nodeId}` : `Node not found with deviceId of ${deviceId}`, 404));
  }

  let readingTimestamp;
  if (timestamp !== undefined) {
    readingTimestamp = new Date(timestamp);
    if (Number.isNaN(readingTimestamp.getTime())) {
      return next(new ErrorResponse('timestamp must be a valid date', 400));
    }
  }

  const reading = await PressureReading.create({
    nodeId: node._id,
    pressure: parsedPressure,
    ...(readingTimestamp ? { timestamp: readingTimestamp } : {})
  });

  const alertEvaluation = await evaluateNodeReading(node, parsedPressure);

  res.status(201).json({
    success: true,
    data: {
      reading,
      node: {
        id: node._id,
        deviceId: node.deviceId,
        name: node.name,
        location: node.location,
        maop: node.maop
      },
      alertEvaluation
    }
  });
});

module.exports = {
  createPressureReading
};
