import { Bell, Search, Wifi, WifiOff } from 'lucide-react';
import { useAlertStore, useAuthStore } from '../store';
import { useState, useEffect } from 'react';
import { getSocket } from '../socket';
import './TopBar.css';

export default function TopBar() {
  const user = useAuthStore((s) => s.user);
  const { unreadCount, recentAlerts, clearUnread } = useAlertStore();
  const [connected, setConnected] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search cameras, alerts..." className="search-input" />
        </div>
      </div>

      <div className="topbar-right">
        {/* Connection Status */}
        <div className={`connection-status ${connected ? 'online' : 'offline'}`}>
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{connected ? 'Live' : 'Disconnected'}</span>
        </div>

        {/* Alert Bell */}
        <div className="alert-bell-wrapper">
          <button
            className="btn-icon alert-bell"
            onClick={() => {
              setShowAlerts(!showAlerts);
              if (!showAlerts) clearUnread();
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {/* Alert Dropdown */}
          {showAlerts && (
            <div className="alert-dropdown">
              <div className="dropdown-header">
                <span>Recent Alerts</span>
                <button className="btn-ghost btn-sm" onClick={() => setShowAlerts(false)}>Close</button>
              </div>
              <div className="dropdown-list">
                {recentAlerts.length === 0 ? (
                  <div className="dropdown-empty">No recent alerts</div>
                ) : (
                  recentAlerts.slice(0, 8).map((item, i) => (
                    <div key={i} className={`dropdown-item severity-${item.alert?.severity || 'medium'}`}>
                      <div className="dropdown-item-type">{item.alert?.alertType || 'alert'}</div>
                      <div className="dropdown-item-camera">{item.camera?.name || 'Unknown'}</div>
                      <div className="dropdown-item-time">
                        {item.alert?.createdAt ? new Date(item.alert.createdAt).toLocaleTimeString() : 'now'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="user-info">
          <div className="user-avatar">
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
          <div className="user-details">
            <span className="user-name">{user?.username || 'User'}</span>
            <span className="user-role">{user?.role || 'viewer'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
