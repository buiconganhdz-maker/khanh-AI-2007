import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Camera, Bell, BarChart3, Settings,
  Shield, ChevronLeft, ChevronRight, LogOut, BookOpen
} from 'lucide-react';
import { useUIStore, useAuthStore, useAlertStore } from '../store';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/cameras', icon: Camera, label: 'Cameras' },
  { path: '/alerts', icon: Bell, label: 'Alerts' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/guide', icon: BookOpen, label: 'Hướng Dẫn' },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const logout = useAuthStore((s) => s.logout);
  const unreadCount = useAlertStore((s) => s.unreadCount);
  const location = useLocation();

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Shield size={24} />
        </div>
        {!sidebarCollapsed && (
          <div className="logo-text">
            <span className="logo-title">AI Camera</span>
            <span className="logo-subtitle">Security System</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon size={20} />
            {!sidebarCollapsed && <span>{item.label}</span>}
            {item.path === '/alerts' && unreadCount > 0 && (
              <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <button className="nav-item logout-btn" onClick={logout} title="Logout">
          <LogOut size={20} />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>

        <button className="collapse-btn" onClick={toggleSidebar}>
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
