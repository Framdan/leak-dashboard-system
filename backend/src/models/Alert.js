const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  nodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Node',
    required: true,
    index: true
  },
  pressure: {
    type: Number,
    required: true
  },
  level: {
    type: String,
    enum: ["caution", "warning"],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('Alert', alertSchema);
