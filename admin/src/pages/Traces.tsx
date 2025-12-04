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
  messages: any[];
  model: string;
  temperature: number | null;
  maxTokens: number | null;
  response: any | null;
  completion: string | null;
  toolCalls: any[] | null;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  cost: number | null;
  error: string | null;
  status: string;
  createdAt: string;
}

interface TraceStats {
  totalTraces: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  totalCost: number;
  totalTokens: number;
}

export default function Traces() {
  const [traces, setTraces] = useState<LLMTrace[]>([]);
  const [stats, setStats] = useState<TraceStats | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<LLMTrace | null>(null);
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
    } catch (error) {
      console.error('Failed to load trace details:', error);
    }
  };

  const formatCost = (cost: number | null) => {
    if (cost === null) return 'N/A';
    return `$${cost.toFixed(6)}`;
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
          <div className="stat-card">
            <div className="stat-label">Total Tokens</div>
            <div className="stat-value">{stats.totalTokens?.toLocaleString() || '0'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Cost</div>
            <div className="stat-value">{formatCost(stats.totalCost)}</div>
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
                  <th>Model</th>
                  <th>Status</th>
                  <th>Total Tokens</th>
                  <th>Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {traces.map((trace) => (
                  <tr
                    key={trace.id}
                    className={selectedTrace?.id === trace.id ? 'selected' : ''}
                  >
                    <td>{formatDate(trace.createdAt)}</td>
                    <td className="mono">{trace.sessionId?.substring(0, 8) || 'N/A'}</td>
                    <td className="mono">{trace.userId?.substring(0, 12) || 'N/A'}</td>
                    <td>{trace.model}</td>
                    <td>
                      <span className={`status-badge status-${trace.status}`}>
                        {trace.status}
                      </span>
                    </td>
                    <td>{trace.totalTokens?.toLocaleString() || 'N/A'}</td>
                    <td>{formatCost(trace.cost)}</td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => viewTrace(trace.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Trace Details */}
        {selectedTrace && (
          <div className="trace-details">
            <div className="detail-header">
              <h2>Trace Details</h2>
              <button onClick={() => setSelectedTrace(null)}>Close</button>
            </div>

            <div className="detail-section">
              <h3>Metadata</h3>
              <div className="detail-grid">
                <div>
                  <strong>Trace ID:</strong> <span className="mono">{selectedTrace.id}</span>
                </div>
                <div>
                  <strong>Session ID:</strong> <span className="mono">{selectedTrace.sessionId || 'N/A'}</span>
                </div>
                <div>
                  <strong>User ID:</strong> <span className="mono">{selectedTrace.userId || 'N/A'}</span>
                </div>
                <div>
                  <strong>Model:</strong> {selectedTrace.model}
                </div>
                <div>
                  <strong>Temperature:</strong> {selectedTrace.temperature || 'N/A'}
                </div>
                <div>
                  <strong>Max Tokens:</strong> {selectedTrace.maxTokens || 'N/A'}
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={`status-badge status-${selectedTrace.status}`}>
                    {selectedTrace.status}
                  </span>
                </div>
                <div>
                  <strong>Created:</strong> {formatDate(selectedTrace.createdAt)}
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Performance</h3>
              <div className="detail-grid">
                <div>
                  <strong>Input Tokens:</strong> {selectedTrace.inputTokens?.toLocaleString() || 'N/A'}
                </div>
                <div>
                  <strong>Output Tokens:</strong> {selectedTrace.outputTokens?.toLocaleString() || 'N/A'}
                </div>
                <div>
                  <strong>Total Tokens:</strong> {selectedTrace.totalTokens?.toLocaleString() || 'N/A'}
                </div>
                <div>
                  <strong>Cost:</strong> {formatCost(selectedTrace.cost)}
                </div>
              </div>
            </div>

            {selectedTrace.error && (
              <div className="detail-section error-section">
                <h3>Error</h3>
                <pre>{selectedTrace.error}</pre>
              </div>
            )}

            <div className="detail-section">
              <h3>Input Messages</h3>
              <pre className="json-viewer">{JSON.stringify(selectedTrace.messages, null, 2)}</pre>
            </div>

            {selectedTrace.response && (
              <div className="detail-section">
                <h3>Full Response</h3>
                <pre className="json-viewer">{JSON.stringify(selectedTrace.response, null, 2)}</pre>
              </div>
            )}

            {selectedTrace.completion && (
              <div className="detail-section">
                <h3>Completion Text</h3>
                <pre className="completion-text">{selectedTrace.completion}</pre>
              </div>
            )}

            {selectedTrace.toolCalls && selectedTrace.toolCalls.length > 0 && (
              <div className="detail-section">
                <h3>Tool Calls</h3>
                <pre className="json-viewer">{JSON.stringify(selectedTrace.toolCalls, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
