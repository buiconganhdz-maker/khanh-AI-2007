import { useEffect, useState } from 'react';
import {
  Camera, Bell, Shield, Activity, AlertTriangle,
  Users, Flame, Eye, TrendingUp, Clock
} from 'lucide-react';
import { useAlertStore, useCameraStore } from '../store';
import { aiAPI } from '../api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import './Dashboard.css';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#00d4ff'
};

const TYPE_ICONS = {
  person: Users,
  intrusion: AlertTriangle,
  motion: Activity,
  vehicle: Camera,
  fire: Flame,
  smoke: Flame,
  weapon: Shield,
};

function StatsCard({ icon: Icon, label, value, trend, color, glow }) {
  return (
    <div className="stats-card glass-card" style={{ '--card-accent': color }}>
      <div className="stats-icon" style={{ background: glow, color }}>
        <Icon size={22} />
      </div>
      <div className="stats-info">
        <span className="stats-value">{value}</span>
        <span className="stats-label">{label}</span>
      </div>
      {trend !== undefined && (
        <div className={`stats-trend ${trend >= 0 ? 'up' : 'down'}`}>
          <TrendingUp size={14} />
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  );
}

function RecentAlertItem({ alert }) {
  const Icon = TYPE_ICONS[alert.alert?.alertType] || Bell;
  const severity = alert.alert?.severity || 'medium';

  return (
    <div className={`recent-alert-item severity-border-${severity}`}>
      <div className="alert-item-icon" style={{
        background: SEVERITY_COLORS[severity] + '20',
        color: SEVERITY_COLORS[severity]
      }}>
        <Icon size={16} />
      </div>
      <div className="alert-item-info">
        <span className="alert-item-type">{alert.alert?.alertType || 'motion'}</span>
        <span className="alert-item-camera">{alert.camera?.name || 'Camera'}</span>
      </div>
      <div className="alert-item-meta">
        <span className={`badge badge-${severity}`}>{severity}</span>
        <span className="alert-item-time">
          {alert.alert?.createdAt ? new Date(alert.alert.createdAt).toLocaleTimeString() : 'now'}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { cameras, fetchCameras } = useCameraStore();
  const { recentAlerts, stats, fetchStats } = useAlertStore();
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    fetchCameras();
    fetchStats(7);

    // Check AI service health
    aiAPI.health()
      .then(({ data }) => setAiStatus(data))
      .catch(() => setAiStatus(null));

    const interval = setInterval(() => fetchStats(7), 30000);
    return () => clearInterval(interval);
  }, []);

  const onlineCameras = cameras.filter(c => c.status === 'online').length;

  // Chart data
  const chartData = stats?.byDay?.map(d => ({
    date: d._id.split('-').slice(1).join('/'),
    alerts: d.count
  })) || [];

  const pieData = stats?.byType?.map(t => ({
    name: t._id,
    value: t.count
  })) || [];

  const PIE_COLORS = ['#00d4ff', '#8b5cf6', '#ef4444', '#22c55e', '#eab308', '#f97316'];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">AI Camera Security System Overview</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className={`ai-status-badge ${aiStatus ? 'online' : 'offline'}`}>
            <Eye size={14} />
            <span>AI Engine {aiStatus ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4 mb-4">
        <StatsCard
          icon={Camera}
          label="Cameras Online"
          value={`${onlineCameras}/${cameras.length}`}
          color="var(--accent-cyan)"
          glow="var(--accent-cyan-glow)"
        />
        <StatsCard
          icon={Bell}
          label="Total Alerts"
          value={stats?.totalAlerts || 0}
          color="var(--accent-purple)"
          glow="rgba(139, 92, 246, 0.15)"
        />
        <StatsCard
          icon={AlertTriangle}
          label="Unacknowledged"
          value={stats?.unacknowledged || 0}
          color="var(--accent-orange)"
          glow="var(--accent-orange-glow)"
        />
        <StatsCard
          icon={Activity}
          label="Today's Alerts"
          value={stats?.todayAlerts || 0}
          color="var(--accent-green)"
          glow="var(--accent-green-glow)"
        />
      </div>

      {/* Charts Row */}
      <div className="dashboard-grid">
        {/* Alert Trend Chart */}
        <div className="glass-card chart-card">
          <h3 className="card-title">
            <TrendingUp size={18} />
            Alert Trend (7 Days)
          </h3>
          <div className="chart-container">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#555577" fontSize={12} />
                  <YAxis stroke="#555577" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(20, 20, 50, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#e8e8f0'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="alerts"
                    stroke="#00d4ff"
                    strokeWidth={2}
                    fill="url(#alertGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <Activity size={40} />
                <p>No alert data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Alert Types Pie */}
        <div className="glass-card chart-card">
          <h3 className="card-title">
            <Shield size={18} />
            Alert Types
          </h3>
          <div className="chart-container">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(20, 20, 50, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#e8e8f0'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <Shield size={40} />
                <p>No detection data yet</p>
              </div>
            )}
            {/* Legend */}
            <div className="pie-legend">
              {pieData.map((item, i) => (
                <div key={item.name} className="legend-item">
                  <span className="legend-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="legend-label">{item.name}</span>
                  <span className="legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Camera Grid + Recent Alerts */}
      <div className="dashboard-grid mt-4">
        {/* Camera Status */}
        <div className="glass-card">
          <h3 className="card-title">
            <Camera size={18} />
            Camera Status
          </h3>
          <div className="camera-status-list">
            {cameras.length === 0 ? (
              <div className="chart-empty">
                <Camera size={40} />
                <p>No cameras configured</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Go to Settings to add cameras
                </p>
              </div>
            ) : (
              cameras.map(cam => (
                <div key={cam._id} className="camera-status-item">
                  <div className="cam-preview">
                    <Camera size={20} />
                  </div>
                  <div className="cam-info">
                    <span className="cam-name">{cam.name}</span>
                    <span className="cam-location">{cam.location}</span>
                  </div>
                  <span className={`badge badge-${cam.status === 'online' ? 'online' : 'offline'}`}>
                    {cam.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="glass-card">
          <h3 className="card-title">
            <Clock size={18} />
            Recent Alerts
          </h3>
          <div className="recent-alerts-list">
            {recentAlerts.length === 0 ? (
              <div className="chart-empty">
                <Bell size={40} />
                <p>No recent alerts</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Alerts will appear here in real-time
                </p>
              </div>
            ) : (
              recentAlerts.slice(0, 10).map((alert, i) => (
                <RecentAlertItem key={i} alert={alert} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
