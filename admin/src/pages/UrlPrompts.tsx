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

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>URL Path Prompts</h1>
        <p>Path-specific prompts (e.g., /products/*, /checkout)</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">URL Prompts</div>
          <button className="btn btn-primary" onClick={handleCreate}>+ Add Prompt</button>
        </div>

        <table className="table">
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
                  <div className="table-actions">
                    <button className="btn btn-secondary" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingItem ? 'Edit' : 'Create'} URL Prompt</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">URL Pattern *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.urlPattern}
                  onChange={(e) => setFormData({ ...formData, urlPattern: e.target.value })}
                  placeholder="/products/*, /checkout"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Prompt *</label>
                <textarea
                  className="form-textarea"
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} /> Active</label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
