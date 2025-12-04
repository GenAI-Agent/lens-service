import { useEffect, useState } from 'react';
import { urlPromptsApi, UrlPathPrompt } from '../api';

export default function UrlPrompts() {
  const [items, setItems] = useState<UrlPathPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<UrlPathPrompt | null>(null);
  const [formData, setFormData] = useState({
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
      const data = await urlPromptsApi.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to load URL prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ urlPattern: '', prompt: '', priority: 0, isActive: true });
    setShowModal(true);
  };

  const handleEdit = (item: UrlPathPrompt) => {
    setEditingItem(item);
    setFormData({
      urlPattern: item.urlPattern,
      prompt: item.prompt,
      priority: item.priority,
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await urlPromptsApi.update(editingItem.id, formData);
      } else {
        await urlPromptsApi.create(formData);
      }
      await loadItems();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save URL prompt:', error);
      alert('Failed to save');
    }
  };

  const handleDelete = async (id: number) => {
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
      <div className="lens-os-admin-card">
        <div className="lens-os-admin-card-header">
          <div className="lens-os-admin-card-title">URL Prompts</div>
          <button className="lens-os-admin-btn lens-os-admin-btn-primary" onClick={handleCreate}>+ Add Prompt</button>
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
            {items.map((item) => (
              <tr key={item.id}>
                <td><code>{item.urlPattern}</code></td>
                <td>{item.prompt.substring(0, 80)}...</td>
                <td>{item.priority}</td>
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
              <h2 className="lens-os-admin-modal-title">{editingItem ? 'Edit' : 'Create'} URL Prompt</h2>
              <button className="lens-os-admin-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="lens-os-admin-form-group">
                <label className="lens-os-admin-form-label">URL Pattern *</label>
                <input
                  type="text"
                  className="lens-os-admin-form-input"
                  value={formData.urlPattern}
                  onChange={(e) => setFormData({ ...formData, urlPattern: e.target.value })}
                  placeholder="/products/*, /checkout"
                  required
                />
              </div>
              <div className="lens-os-admin-form-group">
                <label className="lens-os-admin-form-label">Prompt *</label>
                <textarea
                  className="lens-os-admin-form-textarea"
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  required
                />
              </div>
              <div className="lens-os-admin-form-group">
                <label className="lens-os-admin-form-label">Priority</label>
                <input
                  type="number"
                  className="lens-os-admin-form-input"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                />
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
