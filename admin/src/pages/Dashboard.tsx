import { useEffect, useState } from 'react';
import {
  sitePromptsApi,
  skillsApi,
  knowledgeBaseApi,
  sessionsApi,
  SitePrompt
} from '../api';

interface TraceStats {
  totalTraces: number;
  successCount: number;
  errorCount: number;
  successRate: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    sitePrompts: 0,
    skills: 0,
    knowledgeBase: 0,
    sessions: 0,
  });
  const [traceStats, setTraceStats] = useState<TraceStats | null>(null);
  const [traceTimeRange, setTraceTimeRange] = useState('7d'); // 7d, 30d, 90d, all
  const [loading, setLoading] = useState(true);
  const [sitePrompts, setSitePrompts] = useState<SitePrompt[]>([]);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [editingSiteItem, setEditingSiteItem] = useState<SitePrompt | null>(null);
  const [siteFormData, setSiteFormData] = useState({
    name: '',
    prompt: '',
    isGlobal: true,
    isActive: true,
  });

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
      const [sitePromptsData, skills, knowledgeBase, sessions] = await Promise.all([
        sitePromptsApi.getAll(),
        skillsApi.getAll(),
        knowledgeBaseApi.getAll(),
        sessionsApi.getAll(),
      ]);

      setSitePrompts(sitePromptsData);
      setStats({
        sitePrompts: sitePromptsData.length,
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


  // Site Prompt handlers
  const handleCreateSite = () => {
    setEditingSiteItem(null);
    setSiteFormData({ name: '', prompt: '', isGlobal: true, isActive: true });
    setShowSiteModal(true);
  };

  const handleEditSite = (item: SitePrompt) => {
    setEditingSiteItem(item);
    setSiteFormData({
      name: item.name,
      prompt: item.prompt,
      isGlobal: item.isGlobal,
      isActive: item.isActive,
    });
    setShowSiteModal(true);
  };

  const handleSubmitSite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSiteItem) {
        await sitePromptsApi.update(editingSiteItem.id, siteFormData);
      } else {
        await sitePromptsApi.create(siteFormData);
      }
      await loadStats();
      setShowSiteModal(false);
    } catch (error) {
      console.error('Failed to save site prompt:', error);
      alert('Failed to save prompt');
    }
  };

  const handleDeleteSite = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await sitePromptsApi.delete(id);
      await loadStats();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete');
    }
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
          </div>
        )}
      </div>

      {/* Combined System Statistics */}
      <div className="lens-os-admin-card" style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '20px' }}>System Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '8px' }}>Skills</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3498db' }}>{stats.skills}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '8px' }}>Knowledge Base</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2ecc71' }}>{stats.knowledgeBase}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '8px' }}>Active Sessions</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FF9A56' }}>{stats.sessions}</div>
          </div>
        </div>
      </div>

      {/* Site Prompt Section */}
      <div className="lens-os-admin-card">
        <div className="lens-os-admin-card-header">
          <div className="lens-os-admin-card-title">Site Prompt</div>
          <button className="lens-os-admin-btn lens-os-admin-btn-primary" onClick={handleCreateSite}>+ Add Prompt</button>
        </div>

        <table className="lens-os-admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Prompt Preview</th>
              <th>Global</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sitePrompts.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.prompt.substring(0, 100)}...</td>
                <td>{item.isGlobal ? 'Yes' : 'No'}</td>
                <td style={{ color: item.isActive ? '#2ecc71' : '#95a5a6' }}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </td>
                <td>
                  <div className="lens-os-admin-table-actions">
                    <button className="lens-os-admin-btn lens-os-admin-btn-secondary" onClick={() => handleEditSite(item)}>Edit</button>
                    <button className="lens-os-admin-btn lens-os-admin-btn-danger" onClick={() => handleDeleteSite(item.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sitePrompts.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            No site prompts yet. Create one to provide context about your website.
          </p>
        )}
      </div>

      {/* Site Prompt Modal */}
      {showSiteModal && (
        <div className="lens-os-admin-modal-overlay" onClick={() => setShowSiteModal(false)}>
          <div className="lens-os-admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lens-os-admin-modal-header">
              <h2 className="lens-os-admin-modal-title">{editingSiteItem ? 'Edit' : 'Create'} Site Prompt</h2>
              <button className="lens-os-admin-modal-close" onClick={() => setShowSiteModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitSite}>
              <div className="lens-os-admin-form-group">
                <label className="lens-os-admin-form-label">Name *</label>
                <input
                  type="text"
                  className="lens-os-admin-form-input"
                  value={siteFormData.name}
                  onChange={(e) => setSiteFormData({ ...siteFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="lens-os-admin-form-group">
                <label className="lens-os-admin-form-label">Prompt *</label>
                <textarea
                  className="lens-os-admin-form-textarea"
                  style={{ minHeight: '200px' }}
                  value={siteFormData.prompt}
                  onChange={(e) => setSiteFormData({ ...siteFormData, prompt: e.target.value })}
                  required
                />
              </div>
              <div className="lens-os-admin-form-group">
                <label><input type="checkbox" checked={siteFormData.isGlobal} onChange={(e) => setSiteFormData({ ...siteFormData, isGlobal: e.target.checked })} /> Global</label>
              </div>
              <div className="lens-os-admin-form-group">
                <label><input type="checkbox" checked={siteFormData.isActive} onChange={(e) => setSiteFormData({ ...siteFormData, isActive: e.target.checked })} /> Active</label>
              </div>
              <div className="lens-os-admin-modal-footer">
                <button type="button" className="lens-os-admin-btn lens-os-admin-btn-secondary" onClick={() => setShowSiteModal(false)}>Cancel</button>
                <button type="submit" className="lens-os-admin-btn lens-os-admin-btn-primary">{editingSiteItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
