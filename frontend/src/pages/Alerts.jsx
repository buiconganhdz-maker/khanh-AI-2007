import { useEffect, useState } from 'react';
import {
  Bell, Check, Filter, AlertTriangle, Users, Activity,
  Camera, Flame, Shield, ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
import { useAlertStore } from '../store';
import { alertsAPI } from '../api';
import toast from 'react-hot-toast';
import './Alerts.css';

const TYPE_ICONS = {
  person: Users,
  intrusion: AlertTriangle,
  motion: Activity,
  vehicle: Camera,
  fire: Flame,
  smoke: Flame,
  weapon: Shield,
};

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#00d4ff'
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    alertType: '',
    severity: '',
    acknowledged: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const fetchAlerts = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.alertType) params.alertType = filters.alertType;
      if (filters.acknowledged) params.acknowledged = filters.acknowledged;

      const { data } = await alertsAPI.list(params);
      setAlerts(data.alerts);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, [filters]);

  const handleAcknowledge = async (id) => {
    try {
      await alertsAPI.acknowledge(id);
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, acknowledged: true } : a));
      toast.success('Alert acknowledged');
    } catch (err) {
      toast.error('Failed to acknowledge');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Alerts</h1>
          <p className="subtitle">{pagination.total} total alerts</p>
        </div>
        <div className="flex gap-2">
          <button
            className={`btn btn-ghost ${showFilters ? 'active-filter' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="glass-card filters-bar mb-4">
          <div className="filters-grid">
            <div className="input-group">
              <label>Type</label>
              <select
                className="input"
                value={filters.alertType}
                onChange={e => setFilters({ ...filters, alertType: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="motion">Motion</option>
                <option value="person">Person</option>
                <option value="intrusion">Intrusion</option>
                <option value="vehicle">Vehicle</option>
                <option value="fire">Fire</option>
                <option value="smoke">Smoke</option>
                <option value="weapon">Weapon</option>
              </select>
            </div>
            <div className="input-group">
              <label>Status</label>
              <select
                className="input"
                value={filters.acknowledged}
                onChange={e => setFilters({ ...filters, acknowledged: e.target.value })}
              >
                <option value="">All</option>
                <option value="false">Unacknowledged</option>
                <option value="true">Acknowledged</option>
              </select>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setFilters({ alertType: '', severity: '', acknowledged: '' })}
              style={{ alignSelf: 'flex-end' }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Alert List */}
      <div className="alerts-list">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton alert-skeleton" />
          ))
        ) : alerts.length === 0 ? (
          <div className="glass-card empty-state">
            <Bell size={56} />
            <h3>No Alerts Found</h3>
            <p>No alerts match your current filters</p>
          </div>
        ) : (
          alerts.map(alert => {
            const Icon = TYPE_ICONS[alert.alertType] || Bell;
            const sevColor = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.medium;

            return (
              <div
                key={alert._id}
                className={`alert-row glass-card ${alert.acknowledged ? 'acknowledged' : ''}`}
                onClick={() => setSelectedAlert(selectedAlert?._id === alert._id ? null : alert)}
              >
                <div className="alert-row-icon" style={{
                  background: sevColor + '15',
                  color: sevColor
                }}>
                  <Icon size={20} />
                </div>

                <div className="alert-row-info">
                  <div className="alert-row-title">
                    <span className="alert-type-label">{alert.alertType}</span>
                    <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                  </div>
                  <div className="alert-row-meta">
                    <span>
                      <Camera size={12} />
                      {alert.cameraId?.name || 'Unknown Camera'}
                    </span>
                    <span>
                      Confidence: {(alert.confidence * 100).toFixed(0)}%
                    </span>
                    <span>
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="alert-row-actions">
                  {!alert.acknowledged ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcknowledge(alert._id);
                      }}
                    >
                      <Check size={14} /> Acknowledge
                    </button>
                  ) : (
                    <span className="ack-label">
                      <Check size={14} /> Done
                    </span>
                  )}
                </div>

                {/* Expanded detail */}
                {selectedAlert?._id === alert._id && (
                  <div className="alert-detail" onClick={e => e.stopPropagation()}>
                    {alert.snapshot && (
                      <div className="alert-snapshot">
                        <img
                          src={`http://localhost:5000${alert.snapshot}`}
                          alt="Alert snapshot"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="alert-detail-info">
                      <h4>Detected Objects</h4>
                      {alert.objects?.length > 0 ? (
                        <div className="objects-list">
                          {alert.objects.map((obj, i) => (
                            <div key={i} className="object-tag">
                              <span>{obj.name}</span>
                              <span className="obj-conf">{(obj.confidence * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          No objects recorded
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-ghost btn-sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchAlerts(pagination.page - 1)}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="page-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={pagination.page >= pagination.pages}
            onClick={() => fetchAlerts(pagination.page + 1)}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
