import { useEffect, useState } from 'react';
import {
  sitePromptsApi,
  urlPromptsApi,
  skillsApi,
  knowledgeBaseApi,
  sessionsApi
} from '../api';

interface TraceStats {
  totalTraces: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  totalCost: number;
  totalTokens: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    sitePrompts: 0,
    urlPrompts: 0,
    skills: 0,
    knowledgeBase: 0,
    sessions: 0,
  });
  const [traceStats, setTraceStats] = useState<TraceStats | null>(null);
  const [traceTimeRange, setTraceTimeRange] = useState('7d'); // 7d, 30d, 90d, all
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadTraceStats();
  }, []);

  useEffect(() => {
    loadTraceStats();
  }, [traceTimeRange]);

  const getDateRange = () => {
    const now = new Date();
    let dateFrom: Date | null = null;

    switch (traceTimeRange) {
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

  const loadStats = async () => {
    try {
      const [sitePrompts, urlPrompts, skills, knowledgeBase, sessions] = await Promise.all([
        sitePromptsApi.getAll(),
        urlPromptsApi.getAll(),
        skillsApi.getAll(),
        knowledgeBaseApi.getAll(),
        sessionsApi.getAll(),
      ]);

      setStats({
        sitePrompts: sitePrompts.length,
        urlPrompts: urlPrompts.length,
        skills: skills.length,
        knowledgeBase: knowledgeBase.length,
        sessions: sessions.length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTraceStats = async () => {
    try {
      const params = new URLSearchParams();
      const { dateFrom, dateTo } = getDateRange();
      if (dateFrom) params.append('dateFrom', dateFrom.toISOString());
      params.append('dateTo', dateTo.toISOString());

      const response = await fetch(`/api/admin/traces/stats?${params}`);
      const data = await response.json();
      setTraceStats(data);
    } catch (error) {
      console.error('Failed to load trace stats:', error);
    }
  };

  const formatCost = (cost: number | null) => {
    if (cost === null || cost === undefined) return '$0.00';
    return `$${cost.toFixed(4)}`;
  };

  if (loading) {
    return <div className="lens-os-admin-loading">Loading...</div>;
  }

  return (
    <div>
      {/* LLM Trace Statistics - Moved to Top */}
      <div className="lens-os-admin-card" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>LLM Trace Statistics</h2>
          <select
            className="lens-os-admin-form-select"
            value={traceTimeRange}
            onChange={(e) => setTraceTimeRange(e.target.value)}
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {traceStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>Total Traces</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3498db' }}>{traceStats.totalTraces}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>Success Rate</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2ecc71' }}>{traceStats.successRate.toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>Total Tokens</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FF9A56' }}>{traceStats.totalTokens?.toLocaleString() || '0'}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>Total Cost</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e67e22' }}>{formatCost(traceStats.totalCost)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Combined System Statistics */}
      <div className="lens-os-admin-card">
        <h2 style={{ marginBottom: '20px' }}>System Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '8px' }}>Site Prompts</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3498db' }}>{stats.sitePrompts}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '8px' }}>URL Prompts</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2ecc71' }}>{stats.urlPrompts}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '8px' }}>Skills</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FF9A56' }}>{stats.skills}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '8px' }}>Knowledge Base</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e67e22' }}>{stats.knowledgeBase}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '8px' }}>Active Sessions</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e74c3c' }}>{stats.sessions}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
