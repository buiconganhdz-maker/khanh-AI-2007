const express = require('express');
const Detection = require('../models/Detection');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/detections - List detections
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, cameraId, objectName, startDate, endDate } = req.query;

    const filter = {};
    if (cameraId) filter.cameraId = cameraId;
    if (objectName) filter.objectName = objectName;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const total = await Detection.countDocuments(filter);
    const detections = await Detection.find(filter)
      .populate('cameraId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      detections,
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

// GET /api/detections/stats - Detection statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const totalDetections = await Detection.countDocuments();

    // By object type
    const byObject = await Detection.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$objectName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // By hour (for heatmap)
    const byHour = await Detection.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      stats: {
        totalDetections,
        byObject,
        byHour
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
