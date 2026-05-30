import { useEffect, useState } from 'react';
import { Camera, Plus, Play, Square, MapPin, Settings, Trash2, RefreshCw } from 'lucide-react';
import { useCameraStore } from '../store';
import { camerasAPI, aiAPI } from '../api';
import toast from 'react-hot-toast';
import './Cameras.css';

export default function CamerasPage() {
  const { cameras, fetchCameras } = useCameraStore();
  const [showModal, setShowModal] = useState(false);
  const [editCamera, setEditCamera] = useState(null);
  const [form, setForm] = useState({ name: '', rtspUrl: '0', location: '' });
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchCameras();
  }, []);

  const handleCreate = async () => {
    if (!form.name) return toast.error('Camera name required');
    try {
      await camerasAPI.create(form);
      toast.success('Camera added');
      setShowModal(false);
      setForm({ name: '', rtspUrl: '0', location: '' });
      fetchCameras();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create');
    }
  };

  const handleUpdate = async () => {
    try {
      await camerasAPI.update(editCamera._id, form);
      toast.success('Camera updated');
      setEditCamera(null);
      setShowModal(false);
      fetchCameras();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this camera?')) return;
    try {
      await camerasAPI.delete(id);
      toast.success('Camera deleted');
      fetchCameras();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const startProcessing = async (cam) => {
    try {
      setProcessing(p => ({ ...p, [cam._id]: 'starting' }));
      await aiAPI.startCamera(cam._id, cam.rtspUrl, cam.name);
      toast.success(`Started processing: ${cam.name}`);
      setProcessing(p => ({ ...p, [cam._id]: 'running' }));
      fetchCameras();
    } catch (err) {
      toast.error(`Failed to start: ${err.message}`);
      setProcessing(p => ({ ...p, [cam._id]: 'error' }));
    }
  };

  const stopProcessing = async (cam) => {
    try {
      await aiAPI.stopCamera(cam._id);
      toast.success(`Stopped: ${cam.name}`);
      setProcessing(p => ({ ...p, [cam._id]: 'stopped' }));
      fetchCameras();
    } catch (err) {
      toast.error('Failed to stop');
    }
  };

  const openEdit = (cam) => {
    setEditCamera(cam);
    setForm({ name: cam.name, rtspUrl: cam.rtspUrl, location: cam.location });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditCamera(null);
    setForm({ name: '', rtspUrl: '0', location: '' });
    setShowModal(true);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Cameras</h1>
          <p className="subtitle">Manage surveillance cameras and AI processing</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={fetchCameras}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Camera
          </button>
        </div>
      </div>

      {/* Camera Grid */}
      {cameras.length === 0 ? (
        <div className="glass-card empty-state">
          <Camera size={56} />
          <h3>No Cameras</h3>
          <p>Add your first camera to start monitoring</p>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Camera
          </button>
        </div>
      ) : (
        <div className="camera-grid">
          {cameras.map(cam => (
            <div key={cam._id} className="camera-card glass-card">
              {/* Preview */}
              <div className="camera-preview">
                {(cam.status === 'online' || processing[cam._id] === 'running') ? (
                  <img
                    src={aiAPI.getStreamUrl(cam._id)}
                    alt={cam.name}
                    className="camera-stream-img"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="camera-placeholder">
                    <Camera size={32} />
                    <span>Offline</span>
                  </div>
                )}
                <span className={`camera-status-dot ${cam.status}`} />
              </div>

              {/* Info */}
              <div className="camera-info">
                <div className="camera-name-row">
                  <h3 className="camera-name">{cam.name}</h3>
                  <span className={`badge badge-${cam.status === 'online' ? 'online' : cam.status === 'error' ? 'error' : 'offline'}`}>
                    {cam.status}
                  </span>
                </div>
                <div className="camera-meta">
                  <span><MapPin size={12} /> {cam.location}</span>
                  <span className="camera-source">Source: {cam.rtspUrl}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="camera-actions">
                {processing[cam._id] === 'running' || cam.status === 'online' ? (
                  <button className="btn btn-danger btn-sm" onClick={() => stopProcessing(cam)}>
                    <Square size={14} /> Stop
                  </button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => startProcessing(cam)}>
                    <Play size={14} /> Start AI
                  </button>
                )}
                <button className="btn-icon" onClick={() => openEdit(cam)}>
                  <Settings size={16} />
                </button>
                <button className="btn-icon" onClick={() => handleDelete(cam._id)} style={{ color: 'var(--accent-red)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editCamera ? 'Edit Camera' : 'Add Camera'}</h2>
            <div className="modal-form">
              <div className="input-group">
                <label>Camera Name</label>
                <input
                  className="input"
                  placeholder="e.g. Front Door Camera"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Video Source</label>
                <input
                  className="input"
                  placeholder="0, rtsp://... or absolute path to .mp4 file"
                  value={form.rtspUrl}
                  onChange={e => setForm({ ...form, rtspUrl: e.target.value })}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Nhập <code>0</code> để dùng webcam, địa chỉ <code>rtsp://...</code> cho camera thật, hoặc đường dẫn file MP4 cục bộ (ví dụ: <code>D:/video.mp4</code>) để Demo.
                </span>
              </div>
              <div className="input-group">
                <label>Location</label>
                <input
                  className="input"
                  placeholder="e.g. Main Entrance"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={editCamera ? handleUpdate : handleCreate}>
                {editCamera ? 'Update' : 'Add Camera'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
