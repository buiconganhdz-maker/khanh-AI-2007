import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Clock, Shield } from 'lucide-react';
import { alertsAPI, detectionsAPI } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from 'recharts';
import './Analytics.css';

const CHART_COLORS = ['#00d4ff', '#8b5cf6', '#ef4444', '#22c55e', '#eab308', '#f97316'];

export default function AnalyticsPage() {
  const [alertStats, setAlertStats] = useState(null);
  const [detectionStats, setDetectionStats] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, [days]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [aRes, dRes] = await Promise.all([
        alertsAPI.stats(days),
        detectionsAPI.stats(days)
      ]);
      setAlertStats(aRes.data.stats);
      setDetectionStats(dRes.data.stats);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Transform data for charts
  const dailyData = alertStats?.byDay?.map(d => ({
    date: d._id.split('-').slice(1).join('/'),
    alerts: d.count
  })) || [];

  const typeData = alertStats?.byType?.map(t => ({
    type: t._id,
    count: t.count
  })) || [];

  const severityData = alertStats?.bySeverity?.map(s => ({
    name: s._id,
    value: s.count
  })) || [];

  const hourlyData = detectionStats?.byHour?.map(h => ({
    hour: `${h._id}:00`,
    detections: h.count
  })) || [];

  const objectData = detectionStats?.byObject?.map(o => ({
    object: o._id,
    count: o.count
  })) || [];

  const cameraData = alertStats?.byCamera?.map(c => ({
    camera: c.cameraName,
    alerts: c.count
  })) || [];

  if (loading) {
    return (
      <div className="page-content">
        <div className="page-header">
          <div><h1>Analytics</h1></div>
        </div>
        <div className="grid-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton chart-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p className="subtitle">Detection & Alert Statistics</p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              className={`btn ${days === d ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => setDays(d)}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-3 mb-4">
        <div className="glass-card analytics-summary">
          <div className="summary-icon" style={{ color: 'var(--accent-cyan)', background: 'var(--accent-cyan-glow)' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <div className="summary-value">{alertStats?.totalAlerts || 0}</div>
            <div className="summary-label">Total Alerts</div>
          </div>
        </div>
        <div className="glass-card analytics-summary">
          <div className="summary-icon" style={{ color: 'var(--accent-purple)', background: 'rgba(139, 92, 246, 0.15)' }}>
            <Shield size={24} />
          </div>
          <div>
            <div className="summary-value">{detectionStats?.totalDetections || 0}</div>
            <div className="summary-label">Total Detections</div>
          </div>
        </div>
        <div className="glass-card analytics-summary">
          <div className="summary-icon" style={{ color: 'var(--accent-orange)', background: 'var(--accent-orange-glow)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="summary-value">
              {dailyData.length > 0
                ? Math.round(dailyData.reduce((s, d) => s + d.alerts, 0) / dailyData.length)
                : 0}
            </div>
            <div className="summary-label">Avg Alerts/Day</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2 mb-4">
        {/* Daily Alerts */}
        <div className="glass-card chart-card">
          <h3 className="card-title"><TrendingUp size={18} /> Daily Alert Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#555577" fontSize={11} />
              <YAxis stroke="#555577" fontSize={11} />
              <Tooltip contentStyle={{
                background: 'rgba(20,20,50,0.95)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', color: '#e8e8f0'
              }} />
              <Area type="monotone" dataKey="alerts" stroke="#00d4ff" strokeWidth={2} fill="url(#grad1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Types Bar */}
        <div className="glass-card chart-card">
          <h3 className="card-title"><BarChart3 size={18} /> Alerts by Type</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="type" stroke="#555577" fontSize={11} />
              <YAxis stroke="#555577" fontSize={11} />
              <Tooltip contentStyle={{
                background: 'rgba(20,20,50,0.95)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', color: '#e8e8f0'
              }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {typeData.map((_, i) => (
                  <Bar key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2 mb-4">
        {/* Hourly Heatmap */}
        <div className="glass-card chart-card">
          <h3 className="card-title"><Clock size={18} /> Detections by Hour</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" stroke="#555577" fontSize={10} />
              <YAxis stroke="#555577" fontSize={11} />
              <Tooltip contentStyle={{
                background: 'rgba(20,20,50,0.95)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', color: '#e8e8f0'
              }} />
              <Bar dataKey="detections" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Object Distribution */}
        <div className="glass-card chart-card">
          <h3 className="card-title"><Shield size={18} /> Object Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={objectData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="#555577" fontSize={11} />
              <YAxis dataKey="object" type="category" stroke="#555577" fontSize={11} width={80} />
              <Tooltip contentStyle={{
                background: 'rgba(20,20,50,0.95)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', color: '#e8e8f0'
              }} />
              <Bar dataKey="count" fill="#22c55e" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Camera comparison */}
      {cameraData.length > 0 && (
        <div className="glass-card chart-card">
          <h3 className="card-title"><BarChart3 size={18} /> Alerts by Camera</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cameraData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="camera" stroke="#555577" fontSize={11} />
              <YAxis stroke="#555577" fontSize={11} />
              <Tooltip contentStyle={{
                background: 'rgba(20,20,50,0.95)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', color: '#e8e8f0'
              }} />
              <Bar dataKey="alerts" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
