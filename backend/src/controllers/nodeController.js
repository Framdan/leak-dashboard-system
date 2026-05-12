const Node = require('../models/Node');
const PressureReading = require('../models/PressureReading');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../middleware/errorResponse');

// @desc    Get all nodes
// @route   GET /api/nodes
// @access  Private
const getNodes = asyncHandler(async (req, res, next) => {
  const nodes = await Node.aggregate([
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
        pressure: { $ifNull: [{ $arrayElemAt: ['$latestReading.pressure', 0] }, 0] },
        id: '$_id'
      }
    },
    { $project: { latestReading: 0 } },
    { $sort: { createdAt: -1 } }
  ]);

  res.status(200).json({ success: true, data: nodes });
});

// @desc    Create a new node
// @route   POST /api/nodes
// @access  Private
const createNode = asyncHandler(async (req, res, next) => {
  const { name, location, maop, pipeAge, latitude, longitude } = req.body;

  const node = await Node.create({
    name,
    location,
    maop,
    pipeAge,
    latitude,
    longitude
  });

  res.status(201).json({ success: true, data: node });
});

// @desc    Delete a node
// @route   DELETE /api/nodes/:id
// @access  Private
const deleteNode = asyncHandler(async (req, res, next) => {
  const node = await Node.findById(req.params.id);

  if (!node) {
    return next(new ErrorResponse(`Node not found with id of ${req.params.id}`, 404));
  }

  await node.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// @desc    Update a node
// @route   PUT /api/nodes/:id
// @access  Private
const updateNode = asyncHandler(async (req, res, next) => {
  const node = await Node.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!node) {
    return next(new ErrorResponse(`Node not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({ success: true, data: node });
});

module.exports = {
  getNodes,
  createNode,
  deleteNode,
  updateNode
};
