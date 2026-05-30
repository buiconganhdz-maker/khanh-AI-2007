import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, useAlertStore, useCameraStore, useUIStore } from './store';
import { connectSocket, disconnectSocket } from './socket';
import { authAPI } from './api';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import CamerasPage from './pages/Cameras';
import AlertsPage from './pages/Alerts';
import AnalyticsPage from './pages/Analytics';
import SettingsPage from './pages/Settings';
import GuidePage from './pages/Guide';

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const addRealtimeAlert = useAlertStore((s) => s.addRealtimeAlert);
  const updateCameraStatus = useCameraStore((s) => s.updateCameraStatus);

  useEffect(() => {
    const socket = connectSocket();

    socket.on('new-alert', (data) => {
      addRealtimeAlert(data);

      // Show toast based on severity
      const severity = data.alert?.severity || 'medium';
      const message = `${data.alert?.alertType || 'Alert'} — ${data.camera?.name || 'Camera'}`;

      if (severity === 'critical') {
        import('react-hot-toast').then(({ default: toast }) => {
          toast.error(`🔴 CRITICAL: ${message}`, { duration: 8000 });
        });
      } else if (severity === 'high') {
        import('react-hot-toast').then(({ default: toast }) => {
          toast(message, { icon: '🟠', duration: 5000 });
        });
      } else {
        import('react-hot-toast').then(({ default: toast }) => {
          toast(message, { icon: '🔵', duration: 3000 });
        });
      }
    });

    socket.on('camera-status', (data) => {
      updateCameraStatus(data.cameraId, data.status);
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <TopBar />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/cameras" element={<CamerasPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/guide" element={<GuidePage />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    // Fetch initial CSRF cookie on app load
    authAPI.getCsrf().catch((err) => {
      console.error('Failed to initialize CSRF token:', err);
    });
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(20, 20, 50, 0.95)',
            color: '#e8e8f0',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            borderRadius: '12px',
            fontSize: '0.85rem',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
