/**
 * LLM Traces Page
 * View and analyze all LLM calls with filters and statistics
 */

import { useState, useEffect } from 'react';
import './Traces.css';

interface LLMTrace {
  id: string;
  sessionId: string | null;
  userId: string | null;
  input: any;
  output: string;
  error: string | null;
  status: string;
  createdAt: string;
}

interface TraceStats {
  totalTraces: number;
  successCount: number;
  errorCount: number;
  successRate: number;
}

export default function Traces() {
  const [traces, setTraces] = useState<LLMTrace[]>([]);
  const [stats, setStats] = useState<TraceStats | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<LLMTrace | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSessionId, setFilterSessionId] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTimeRange, setFilterTimeRange] = useState('7d'); // 7d, 30d, 90d, all

  useEffect(() => {
    loadTraces();
    loadStats();
  }, [filterSessionId, filterUserId, filterStatus, filterTimeRange]);

  const getDateRange = () => {
    const now = new Date();
    let dateFrom: Date | null = null;

    switch (filterTimeRange) {
      case '7d':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        dateFrom = null;
    }

    return { dateFrom, dateTo: now };
  };

  const loadTraces = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterSessionId) params.append('sessionId', filterSessionId);
      if (filterUserId) params.append('userId', filterUserId);
      if (filterStatus) params.append('status', filterStatus);

      const { dateFrom, dateTo } = getDateRange();
      if (dateFrom) params.append('dateFrom', dateFrom.toISOString());
      params.append('dateTo', dateTo.toISOString());

      const response = await fetch(`/api/admin/traces?${params}`);
      const data = await response.json();
      setTraces(data);
    } catch (error) {
      console.error('Failed to load traces:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const params = new URLSearchParams();
      const { dateFrom, dateTo } = getDateRange();
      if (dateFrom) params.append('dateFrom', dateFrom.toISOString());
      params.append('dateTo', dateTo.toISOString());

      const response = await fetch(`/api/admin/traces/stats?${params}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const viewTrace = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/traces/${id}`);
      const data = await response.json();
      setSelectedTrace(data);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to load trace details:', error);
    }
  };

  const deleteTrace = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this trace?')) {
      return;
    }

    try {
      await fetch(`/api/admin/traces/${id}`, { method: 'DELETE' });
      await loadTraces();
      await loadStats();
    } catch (error) {
      console.error('Failed to delete trace:', error);
      alert('Failed to delete trace');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="traces-page">
      {/* Statistics */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Traces</div>
            <div className="stat-value">{stats.totalTraces}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Success Rate</div>
            <div className="stat-value">{stats.successRate.toFixed(1)}%</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <select value={filterTimeRange} onChange={(e) => setFilterTimeRange(e.target.value)}>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
        <input
          type="text"
          placeholder="Filter by Session ID"
          value={filterSessionId}
          onChange={(e) => setFilterSessionId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by User ID"
          value={filterUserId}
          onChange={(e) => setFilterUserId(e.target.value)}
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="timeout">Timeout</option>
        </select>
      </div>

      <div className="traces-container">
        {/* Traces List */}
        <div className="traces-list">
          {loading ? (
            <div className="lens-os-admin-loading">Loading traces...</div>
          ) : traces.length === 0 ? (
            <div className="empty-state">No traces found</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Session</th>
                  <th>User</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {traces.map((trace) => (
                  <tr key={trace.id}>
                    <td>{formatDate(trace.createdAt)}</td>
                    <td className="mono">{trace.sessionId?.substring(0, 8) || 'N/A'}</td>
                    <td className="mono">{trace.userId?.substring(0, 12) || 'N/A'}</td>
                    <td>
                      <span className={`status-badge status-${trace.status}`}>
                        {trace.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => viewTrace(trace.id)}
                      >
                        View
                      </button>
                      <button
                        className="btn-delete"
                        onClick={(e) => deleteTrace(trace.id, e)}
                        style={{ marginLeft: '8px' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Trace Details Modal */}
      {showModal && selectedTrace && (
        <div className="lens-os-admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="lens-os-admin-modal" style={{ maxWidth: '900px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="lens-os-admin-modal-header">
              <h2 className="lens-os-admin-modal-title">Trace Details</h2>
              <button className="lens-os-admin-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
              {/* Metadata */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px' }}>Metadata</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                  <div><strong>Trace ID:</strong> <span className="mono">{selectedTrace.id}</span></div>
                  <div><strong>Session ID:</strong> <span className="mono">{selectedTrace.sessionId || 'N/A'}</span></div>
                  <div><strong>User ID:</strong> <span className="mono">{selectedTrace.userId || 'N/A'}</span></div>
                  <div>
                    <strong>Status:</strong>{' '}
                    <span className={`status-badge status-${selectedTrace.status}`}>{selectedTrace.status}</span>
                  </div>
                  <div><strong>Created:</strong> {formatDate(selectedTrace.createdAt)}</div>
                </div>
              </div>

              {/* Error */}
              {selectedTrace.error && (
                <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px' }}>
                  <h3 style={{ marginBottom: '10px', color: '#c00' }}>Error</h3>
                  <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{selectedTrace.error}</pre>
                </div>
              )}

              {/* Input */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px' }}>LLM Input</h3>
                <pre style={{
                  fontSize: '12px',
                  backgroundColor: '#f5f5f5',
                  padding: '15px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '400px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>{JSON.stringify(selectedTrace.input, null, 2)}</pre>
              </div>

              {/* Output */}
              <div>
                <h3 style={{ marginBottom: '10px' }}>LLM Output</h3>
                <pre style={{
                  fontSize: '12px',
                  backgroundColor: '#f5f5f5',
                  padding: '15px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '400px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>{selectedTrace.output}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
