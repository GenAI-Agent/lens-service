import { useEffect, useState } from 'react';
import { sitePromptsApi, SitePrompt } from '../api';

export default function SitePrompts() {
  const [items, setItems] = useState<SitePrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SitePrompt | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    prompt: '',
    isGlobal: true,
    isActive: true,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await sitePromptsApi.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to load site prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', prompt: '', isGlobal: true, isActive: true });
    setShowModal(true);
  };

  const handleEdit = (item: SitePrompt) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      prompt: item.prompt,
      isGlobal: item.isGlobal,
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await sitePromptsApi.update(editingItem.id, formData);
      } else {
        await sitePromptsApi.create(formData);
      }
      await loadItems();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save site prompt:', error);
      alert('Failed to save prompt');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await sitePromptsApi.delete(id);
      await loadItems();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete');
    }
  };

  if (loading) return <div className="lens-os-admin-loading">Loading...</div>;

  return (
    <div>
      <div className="lens-os-admin-card">
        <div className="lens-os-admin-card-header">
          <div className="lens-os-admin-card-title">Site Prompts</div>
          <button className="lens-os-admin-btn lens-os-admin-btn-primary" onClick={handleCreate}>+ Add Prompt</button>
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
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.prompt.substring(0, 100)}...</td>
                <td>{item.isGlobal ? 'Yes' : 'No'}</td>
                <td style={{ color: item.isActive ? '#2ecc71' : '#95a5a6' }}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </td>
                <td>
                  <div className="lens-os-admin-table-actions">
                    <button className="lens-os-admin-btn lens-os-admin-btn-secondary" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="lens-os-admin-btn lens-os-admin-btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="lens-os-admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="lens-os-admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lens-os-admin-modal-header">
              <h2 className="lens-os-admin-modal-title">{editingItem ? 'Edit' : 'Create'} Site Prompt</h2>
              <button className="lens-os-admin-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="lens-os-admin-form-group">
                <label className="lens-os-admin-form-label">Name *</label>
                <input
                  type="text"
                  className="lens-os-admin-form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="lens-os-admin-form-group">
                <label className="lens-os-admin-form-label">Prompt *</label>
                <textarea
                  className="lens-os-admin-form-textarea"
                  style={{ minHeight: '200px' }}
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  required
                />
              </div>
              <div className="lens-os-admin-form-group">
                <label><input type="checkbox" checked={formData.isGlobal} onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })} /> Global</label>
              </div>
              <div className="lens-os-admin-form-group">
                <label><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} /> Active</label>
              </div>
              <div className="lens-os-admin-modal-footer">
                <button type="button" className="lens-os-admin-btn lens-os-admin-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="lens-os-admin-btn lens-os-admin-btn-primary">{editingItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
