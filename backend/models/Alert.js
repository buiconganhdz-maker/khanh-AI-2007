const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  cameraId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camera',
    required: true
  },
  alertType: {
    type: String,
    enum: ['motion', 'intrusion', 'person', 'vehicle', 'fire', 'smoke', 'weapon', 'fall', 'crowd', 'unknown'],
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  snapshot: {
    type: String,
    default: ''
  },
  objects: [{
    name: String,
    confidence: Number,
    bbox: {
      x: Number,
      y: Number,
      w: Number,
      h: Number
    }
  }],
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  acknowledgedAt: {
    type: Date,
    default: null
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for fast queries
alertSchema.index({ cameraId: 1, createdAt: -1 });
alertSchema.index({ alertType: 1, createdAt: -1 });
alertSchema.index({ acknowledged: 1 });

module.exports = mongoose.model('Alert', alertSchema);
