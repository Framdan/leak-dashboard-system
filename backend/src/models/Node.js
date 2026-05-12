const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Node name is required'],
    trim: true,
    maxlength: [50, 'Node name cannot exceed 50 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    index: true
  },
  maop: {
    type: Number,
    required: [true, 'MAOP is required'],
    min: [0, 'MAOP must be positive']
  },
  pipeAge: {
    type: Number,
    required: [true, 'Pipe age is required'],
    min: [0, 'Pipe age cannot be negative']
  },
  latitude: {
    type: Number,
    required: [true, 'Latitude is required'],
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required'],
    min: -180,
    max: 180
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Node', nodeSchema);
