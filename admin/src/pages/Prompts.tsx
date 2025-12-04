import { useEffect, useState } from 'react';
import { sitePromptsApi, urlPromptsApi, SitePrompt, UrlPathPrompt } from '../api';

export default function Prompts() {
  const [sitePrompts, setSitePrompts] = useState<SitePrompt[]>([]);
  const [urlPrompts, setUrlPrompts] = useState<UrlPathPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [editingSiteItem, setEditingSiteItem] = useState<SitePrompt | null>(null);
  const [editingUrlItem, setEditingUrlItem] = useState<UrlPathPrompt | null>(null);

  const [siteFormData, setSiteFormData] = useState({
    name: '',
    prompt: '',
    isGlobal: true,
    isActive: true,
  });

  const [urlFormData, setUrlFormData] = useState({
    urlPattern: '',
    prompt: '',
    priority: 0,
    isActive: true,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const [siteData, urlData] = await Promise.all([
        sitePromptsApi.getAll(),
        urlPromptsApi.getAll()
      ]);
      setSitePrompts(siteData);
      setUrlPrompts(urlData);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setLoading(false);
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
      await loadItems();
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
      await loadItems();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete');
    }
  };

  // URL Prompt handlers
  const handleCreateUrl = () => {
    setEditingUrlItem(null);
    setUrlFormData({ urlPattern: '', prompt: '', priority: 0, isActive: true });
    setShowUrlModal(true);
  };

  const handleEditUrl = (item: UrlPathPrompt) => {
    setEditingUrlItem(item);
    setUrlFormData({
      urlPattern: item.urlPattern,
      prompt: item.prompt,
      priority: item.priority,
      isActive: item.isActive,
    });
    setShowUrlModal(true);
  };

  const handleSubmitUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUrlItem) {
        await urlPromptsApi.update(editingUrlItem.id, urlFormData);
      } else {
        await urlPromptsApi.create(urlFormData);
      }
      await loadItems();
      setShowUrlModal(false);
    } catch (error) {
      console.error('Failed to save URL prompt:', error);
      alert('Failed to save');
    }
  };

  const handleDeleteUrl = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await urlPromptsApi.delete(id);
      await loadItems();
    } catch (error) {
      alert('Failed to delete');
    }
  };

  if (loading) return <div className="lens-os-admin-loading">Loading...</div>;

  return (
    <div>
      {/* Site Prompts Section */}
      <div className="lens-os-admin-card" style={{ marginBottom: '24px' }}>
        <div className="lens-os-admin-card-header">
          <div>
            <div className="lens-os-admin-card-title">Site Prompt</div>
          </div>
          <button className="lens-os-admin-btn lens-os-admin-btn-primary" onClick={handleCreateSite}>+ Add Site Prompt</button>
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
            No site prompts yet. Usually you only need one global site prompt.
          </p>
        )}
      </div>

      {/* URL Prompts Section */}
      <div className="lens-os-admin-card">
        <div className="lens-os-admin-card-header">
          <div>
            <div className="lens-os-admin-card-title">URL Path Prompts</div>
          </div>
          <button className="lens-os-admin-btn lens-os-admin-btn-primary" onClick={handleCreateUrl}>+ Add URL Prompt</button>
        </div>

        <table className="lens-os-admin-table">
          <thead>
            <tr>
              <th>URL Pattern</th>
              <th>Prompt Preview</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {urlPrompts.map((item) => (
              <tr key={item.id}>
                <td><code>{item.urlPattern}</code></td>
                <td>{item.prompt.substring(0, 80)}...</td>
                <td>{item.priority}</td>
                <td style={{ color: item.isActive ? '#2ecc71' : '#95a5a6' }}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </td>
                <td>
                  <div className="lens-os-admin-table-actions">
                    <button className="lens-os-admin-btn lens-os-admin-btn-secondary" onClick={() => handleEditUrl(item)}>Edit</button>
                    <button className="lens-os-admin-btn lens-os-admin-btn-danger" onClick={() => handleDeleteUrl(item.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {urlPrompts.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            No URL prompts yet. Add prompts for specific pages when needed.
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

      {/* URL Prompt Modal */}
      {showUrlModal && (
        <div className="lens-os-admin-modal-overlay" onClick={() => setShowUrlModal(false)}>
          <div className="lens-os-admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lens-os-admin-modal-header">
              <h2 className="lens-os-admin-modal-title">{editingUrlItem ? 'Edit' : 'Create'} URL Prompt</h2>
              <button className="lens-os-admin-modal-close" onClick={() => setShowUrlModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitUrl}>
              <div className="lens-os-admin-form-group">
                <label className="lens-os-admin-form-label">URL Pattern *</label>
                <input
                  type="text"
                  className="lens-os-admin-form-input"
                  value={urlFormData.urlPattern}
                  onChange={(e) => setUrlFormData({ ...urlFormData, urlPattern: e.target.value })}
                  placeholder="/products/*, /checkout"
                  required
                />
              </div>
              <div className="lens-os-admin-form-group">
                <label className="lens-os-admin-form-label">Prompt *</label>
                <textarea
                  className="lens-os-admin-form-textarea"
                  value={urlFormData.prompt}
                  onChange={(e) => setUrlFormData({ ...urlFormData, prompt: e.target.value })}
                  required
                />
              </div>
              <div className="lens-os-admin-form-group">
                <label className="lens-os-admin-form-label">Priority</label>
                <input
                  type="number"
                  className="lens-os-admin-form-input"
                  value={urlFormData.priority}
                  onChange={(e) => setUrlFormData({ ...urlFormData, priority: parseInt(e.target.value) })}
                />
              </div>
              <div className="lens-os-admin-form-group">
                <label><input type="checkbox" checked={urlFormData.isActive} onChange={(e) => setUrlFormData({ ...urlFormData, isActive: e.target.checked })} /> Active</label>
              </div>
              <div className="lens-os-admin-modal-footer">
                <button type="button" className="lens-os-admin-btn lens-os-admin-btn-secondary" onClick={() => setShowUrlModal(false)}>Cancel</button>
                <button type="submit" className="lens-os-admin-btn lens-os-admin-btn-primary">{editingUrlItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
