const express = require('express');
const Camera = require('../models/Camera');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/cameras - List all cameras
router.get('/', auth, async (req, res) => {
  try {
    const cameras = await Camera.find().sort({ createdAt: -1 });
    res.json({ cameras });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/cameras/:id - Get single camera
router.get('/:id', auth, async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    if (!camera) return res.status(404).json({ error: 'Camera not found.' });
    res.json({ camera });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cameras - Create camera
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, rtspUrl, location, settings } = req.body;
    const camera = new Camera({ name, rtspUrl, location, settings });
    await camera.save();

    // Notify via WebSocket
    const io = req.app.get('io');
    if (io) io.emit('camera-update', { action: 'created', camera });

    res.status(201).json({ message: 'Camera created', camera });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/cameras/:id - Update camera
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const camera = await Camera.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!camera) return res.status(404).json({ error: 'Camera not found.' });

    const io = req.app.get('io');
    if (io) io.emit('camera-update', { action: 'updated', camera });

    res.json({ message: 'Camera updated', camera });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cameras/:id - Delete camera
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const camera = await Camera.findByIdAndDelete(req.params.id);
    if (!camera) return res.status(404).json({ error: 'Camera not found.' });

    const io = req.app.get('io');
    if (io) io.emit('camera-update', { action: 'deleted', cameraId: req.params.id });

    res.json({ message: 'Camera deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cameras/:id/zones - Set intrusion zones
router.post('/:id/zones', auth, adminOnly, async (req, res) => {
  try {
    const { zones } = req.body;
    const camera = await Camera.findByIdAndUpdate(
      req.params.id,
      { zones },
      { new: true }
    );
    if (!camera) return res.status(404).json({ error: 'Camera not found.' });
    res.json({ message: 'Zones updated', camera });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/cameras/:id/status - Update camera status (internal)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const camera = await Camera.findByIdAndUpdate(
      req.params.id,
      { status, lastSeen: new Date() },
      { new: true }
    );
    if (!camera) return res.status(404).json({ error: 'Camera not found.' });

    const io = req.app.get('io');
    if (io) io.emit('camera-status', { cameraId: camera._id, status });

    res.json({ camera });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
