import { useEffect, useState } from 'react';
import { skillsApi, Skill } from '../api';

export default function Skills() {
  const [items, setItems] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Skill | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    prompt: '',
    isActive: true,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await skillsApi.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', prompt: '', isActive: true });
    setShowModal(true);
  };

  const handleEdit = (item: Skill) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      prompt: item.prompt,
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await skillsApi.update(editingItem.id, formData);
      } else {
        await skillsApi.create(formData);
      }
      await loadItems();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save skill:', error);
      alert('Failed to save');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await skillsApi.delete(id);
      await loadItems();
    } catch (error) {
      alert('Failed to delete');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Skills</h1>
        <p>Custom skills triggered with /skill_name</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Skills</div>
          <button className="btn btn-primary" onClick={handleCreate}>+ Add Skill</button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Usage</th>
              <th>Prompt Preview</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td><code>/{item.name} query</code></td>
                <td>{item.prompt.substring(0, 80)}...</td>
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
              <h2 className="modal-title">{editingItem ? 'Edit' : 'Create'} Skill</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name * (used in /skill_name)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="order-lookup, product-recommendation"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Prompt *</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '150px' }}
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="You are an expert at..."
                  required
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
