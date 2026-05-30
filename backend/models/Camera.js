const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  rtspUrl: {
    type: String,
    default: '0' // Default to webcam index 0
  },
  location: {
    type: String,
    default: 'Unknown'
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'error', 'processing'],
    default: 'offline'
  },
  zones: [{
    name: String,
    points: [{ x: Number, y: Number }],
    color: { type: String, default: '#ff0000' },
    active: { type: Boolean, default: true }
  }],
  settings: {
    motionSensitivity: { type: Number, default: 50, min: 0, max: 100 },
    detectionConfidence: { type: Number, default: 0.5, min: 0, max: 1 },
    alertCooldown: { type: Number, default: 30 }, // seconds
    enableMotionDetection: { type: Boolean, default: true },
    enableObjectDetection: { type: Boolean, default: true }
  },
  lastSeen: {
    type: Date,
    default: null
  },
  thumbnail: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Camera', cameraSchema);
