const express = require('express');
const multer = require('multer');
const path = require('path');
const Alert = require('../models/Alert');
const Detection = require('../models/Detection');
const Camera = require('../models/Camera');
const { auth } = require('../middleware/auth');
const { apiKeyAuth } = require('../middleware/apiKey');
const { sendNotification } = require('../services/notification');

const router = express.Router();

// Configure multer for snapshot uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'snapshots'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/alerts - List alerts with pagination & filters
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, cameraId, alertType, acknowledged, startDate, endDate, severity } = req.query;
    
    const filter = {};
    if (cameraId) filter.cameraId = cameraId;
    if (alertType) filter.alertType = alertType;
    if (acknowledged !== undefined) filter.acknowledged = acknowledged === 'true';
    if (severity) filter.severity = severity;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const total = await Alert.countDocuments(filter);
    const alerts = await Alert.find(filter)
      .populate('cameraId', 'name location')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      alerts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/alerts - Receive alert from Python AI service
router.post('/', apiKeyAuth, upload.single('image'), async (req, res) => {
  try {
    const { camera_id, type, confidence, objects, severity, metadata } = req.body;

    // Verify camera exists
    const camera = await Camera.findById(camera_id);
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found.' });
    }

    // Determine severity based on type
    let alertSeverity = severity || 'medium';
    if (['fire', 'smoke', 'weapon'].includes(type)) alertSeverity = 'critical';
    else if (['intrusion', 'fall'].includes(type)) alertSeverity = 'high';
    else if (['person', 'crowd'].includes(type)) alertSeverity = 'medium';
    else if (type === 'motion') alertSeverity = 'low';

    const alert = new Alert({
      cameraId: camera_id,
      alertType: type,
      confidence: parseFloat(confidence),
      snapshot: req.file ? `/uploads/snapshots/${req.file.filename}` : '',
      objects: objects ? JSON.parse(objects) : [],
      severity: alertSeverity,
      metadata: metadata ? JSON.parse(metadata) : {}
    });

    await alert.save();

    // Save individual detections
    if (objects) {
      const parsedObjects = JSON.parse(objects);
      for (const obj of parsedObjects) {
        await Detection.create({
          alertId: alert._id,
          cameraId: camera_id,
          objectName: obj.name,
          bbox: obj.bbox || { x: 0, y: 0, w: 0, h: 0 },
          confidence: obj.confidence,
          framePath: alert.snapshot
        });
      }
    }

    // Populate camera info for the response
    await alert.populate('cameraId', 'name location');

    // Push realtime via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('new-alert', {
        alert: alert.toJSON(),
        camera: { name: camera.name, location: camera.location }
      });
    }

    // Send notifications (async, don't wait)
    sendNotification(alert, camera).catch(err => {
      console.error('Notification error:', err.message);
    });

    res.status(201).json({ message: 'Alert created', alert });
  } catch (error) {
    console.error('Alert creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/alerts/:id/acknowledge - Acknowledge alert
router.put('/:id/acknowledge', auth, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        acknowledged: true,
        acknowledgedBy: req.userId,
        acknowledgedAt: new Date()
      },
      { new: true }
    ).populate('cameraId', 'name location');

    if (!alert) return res.status(404).json({ error: 'Alert not found.' });

    const io = req.app.get('io');
    if (io) io.emit('alert-acknowledged', { alertId: alert._id });

    res.json({ message: 'Alert acknowledged', alert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/alerts/stats - Get alert statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Total counts
    const totalAlerts = await Alert.countDocuments();
    const unacknowledged = await Alert.countDocuments({ acknowledged: false });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayAlerts = await Alert.countDocuments({ createdAt: { $gte: todayStart } });

    // By type
    const byType = await Alert.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$alertType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // By day
    const byDay = await Alert.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // By severity
    const bySeverity = await Alert.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    // By camera
    const byCamera = await Alert.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$cameraId', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'cameras',
          localField: '_id',
          foreignField: '_id',
          as: 'camera'
        }
      },
      { $unwind: '$camera' },
      { $project: { cameraName: '$camera.name', count: 1 } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      stats: {
        totalAlerts,
        unacknowledged,
        todayAlerts,
        byType,
        byDay,
        bySeverity,
        byCamera
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
