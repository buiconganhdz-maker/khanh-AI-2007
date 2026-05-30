import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Camera, Bell, User, Shield,
  Save, Plus, Trash2, Key, Mail, Send
} from 'lucide-react';
import { useAuthStore, useCameraStore } from '../store';
import { camerasAPI, authAPI } from '../api';
import toast from 'react-hot-toast';
import './Settings.css';

export default function SettingsPage() {
  const { user, uploadAvatar } = useAuthStore();
  const { cameras, fetchCameras } = useCameraStore();

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const loadingToast = toast.loading('Uploading avatar...');
    try {
      const res = await uploadAvatar(file);
      toast.dismiss(loadingToast);
      if (res.success) {
        toast.success('Avatar updated successfully!');
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to upload avatar.');
    }
  };
  const [activeTab, setActiveTab] = useState('cameras');

  // Camera form
  const [camForm, setCamForm] = useState({ name: '', rtspUrl: '0', location: '' });

  // User form
  const [userForm, setUserForm] = useState({
    username: '', email: '', password: '', role: 'viewer'
  });

  useEffect(() => {
    fetchCameras();
  }, []);

  const handleAddCamera = async () => {
    if (!camForm.name) return toast.error('Name required');
    try {
      await camerasAPI.create(camForm);
      toast.success('Camera added!');
      setCamForm({ name: '', rtspUrl: '0', location: '' });
      fetchCameras();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleDeleteCamera = async (id) => {
    if (!confirm('Delete this camera?')) return;
    try {
      await camerasAPI.delete(id);
      toast.success('Deleted');
      fetchCameras();
    } catch (err) {
      toast.error('Failed');
    }
  };

  const handleAddUser = async () => {
    if (!userForm.username || !userForm.email || !userForm.password) {
      return toast.error('All fields required');
    }
    try {
      await authAPI.register(userForm);
      toast.success('User created!');
      setUserForm({ username: '', email: '', password: '', role: 'viewer' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const tabs = [
    { id: 'cameras', icon: Camera, label: 'Cameras' },
    { id: 'users', icon: User, label: 'Users' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'system', icon: Shield, label: 'System' },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="subtitle">System configuration & management</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Tabs */}
        <div className="settings-tabs glass-card">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">
          {/* Camera Management */}
          {activeTab === 'cameras' && (
            <div className="settings-section glass-card">
              <h3 className="card-title"><Camera size={18} /> Camera Management</h3>

              <div className="add-camera-form">
                <div className="input-group">
                  <label>Camera Name</label>
                  <input className="input" placeholder="Front Door" value={camForm.name}
                    onChange={e => setCamForm({ ...camForm, name: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Video Source</label>
                  <input className="input" placeholder="0, rtsp://... or absolute path to .mp4 file" value={camForm.rtspUrl}
                    onChange={e => setCamForm({ ...camForm, rtspUrl: e.target.value })} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Nhập <code>0</code> để dùng webcam, địa chỉ <code>rtsp://...</code> cho camera thật, hoặc đường dẫn file MP4 cục bộ (ví dụ: <code>D:/video.mp4</code>) để Demo.
                  </span>
                </div>
                <div className="input-group">
                  <label>Location</label>
                  <input className="input" placeholder="Main Entrance" value={camForm.location}
                    onChange={e => setCamForm({ ...camForm, location: e.target.value })} />
                </div>
                <button className="btn btn-primary" onClick={handleAddCamera}>
                  <Plus size={16} /> Add Camera
                </button>
              </div>

              <div className="settings-divider" />

              <h4 className="section-subtitle">Registered Cameras ({cameras.length})</h4>
              <div className="settings-list">
                {cameras.map(cam => (
                  <div key={cam._id} className="settings-list-item">
                    <div className="list-item-info">
                      <Camera size={16} />
                      <div>
                        <span className="list-item-name">{cam.name}</span>
                        <span className="list-item-meta">{cam.location} • {cam.rtspUrl}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className={`badge badge-${cam.status === 'online' ? 'online' : 'offline'}`}>
                        {cam.status}
                      </span>
                      <button className="btn-icon" onClick={() => handleDeleteCamera(cam._id)}
                        style={{ color: 'var(--accent-red)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {cameras.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                    No cameras configured
                  </p>
                )}
              </div>
            </div>
          )}

          {/* User Management */}
          {activeTab === 'users' && (
            <div className="settings-section glass-card">
              <h3 className="card-title"><User size={18} /> User Management</h3>

              {user?.role === 'admin' ? (
                <>
                  <div className="add-camera-form">
                    <div className="input-group">
                      <label>Username</label>
                      <input className="input" placeholder="newuser" value={userForm.username}
                        onChange={e => setUserForm({ ...userForm, username: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <label>Email</label>
                      <input className="input" type="email" placeholder="user@example.com" value={userForm.email}
                        onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <label>Password</label>
                      <input className="input" type="password" placeholder="••••••" value={userForm.password}
                        onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <label>Role</label>
                      <select className="input" value={userForm.role}
                        onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                        <option value="viewer">Viewer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <button className="btn btn-primary" onClick={handleAddUser}>
                      <Plus size={16} /> Create User
                    </button>
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Admin access required to manage users.</p>
              )}

              <div className="settings-divider" />

              <h4 className="section-subtitle">Current User</h4>
              <div className="settings-list">
                <div className="settings-list-item" style={{ gap: '20px' }}>
                  <div className="list-item-info" style={{ flex: 1 }}>
                    <div className="user-avatar-sm" style={{ width: '40px', height: '40px' }}>
                      {user?.avatar ? (
                        <img
                          src={`http://localhost:5000${user.avatar}`}
                          alt="avatar"
                          style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }}
                        />
                      ) : (
                        user?.username?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <span className="list-item-name">{user?.username}</span>
                      <span className="list-item-meta">{user?.email} • {user?.role}</span>
                    </div>
                  </div>
                  <div>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      Change Avatar
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="settings-section glass-card">
              <h3 className="card-title"><Bell size={18} /> Notification Settings</h3>
              <div className="notification-info">
                <div className="notif-option">
                  <div className="notif-label">
                    <Mail size={18} />
                    <div>
                      <span className="list-item-name">Email Notifications</span>
                      <span className="list-item-meta">Configure SMTP in backend/.env</span>
                    </div>
                  </div>
                  <span className="badge badge-offline">Configure in .env</span>
                </div>
                <div className="notif-option">
                  <div className="notif-label">
                    <Send size={18} />
                    <div>
                      <span className="list-item-name">Telegram Notifications</span>
                      <span className="list-item-meta">Set TELEGRAM_BOT_TOKEN & CHAT_ID in backend/.env</span>
                    </div>
                  </div>
                  <span className="badge badge-offline">Configure in .env</span>
                </div>
              </div>
            </div>
          )}

          {/* System */}
          {activeTab === 'system' && (
            <div className="settings-section glass-card">
              <h3 className="card-title"><Shield size={18} /> System Information</h3>
              <div className="system-info-grid">
                <div className="sys-info-item">
                  <span className="sys-label">Backend</span>
                  <span className="sys-value">Node.js + Express</span>
                </div>
                <div className="sys-info-item">
                  <span className="sys-label">AI Engine</span>
                  <span className="sys-value">Python + YOLOv8</span>
                </div>
                <div className="sys-info-item">
                  <span className="sys-label">Database</span>
                  <span className="sys-value">MongoDB Atlas</span>
                </div>
                <div className="sys-info-item">
                  <span className="sys-label">Frontend</span>
                  <span className="sys-value">React + Vite</span>
                </div>
                <div className="sys-info-item">
                  <span className="sys-label">WebSocket</span>
                  <span className="sys-value">Socket.IO</span>
                </div>
                <div className="sys-info-item">
                  <span className="sys-label">Auth</span>
                  <span className="sys-value">JWT</span>
                </div>
              </div>

              <div className="settings-divider" />

              <h4 className="section-subtitle">API Endpoints</h4>
              <div className="api-info">
                <code>Backend: http://localhost:5000</code>
                <code>AI Service: http://localhost:8000</code>
                <code>Frontend: http://localhost:5173</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
