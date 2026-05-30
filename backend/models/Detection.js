const mongoose = require('mongoose');

const detectionSchema = new mongoose.Schema({
  alertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert',
    default: null
  },
  cameraId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camera',
    required: true
  },
  objectName: {
    type: String,
    required: true
  },
  bbox: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    w: { type: Number, required: true },
    h: { type: Number, required: true }
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  framePath: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for analytics
detectionSchema.index({ objectName: 1, createdAt: -1 });
detectionSchema.index({ cameraId: 1, createdAt: -1 });

module.exports = mongoose.model('Detection', detectionSchema);
