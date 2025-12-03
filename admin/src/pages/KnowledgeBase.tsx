import { useEffect, useState } from 'react';
import { knowledgeBaseApi, KnowledgeBase } from '../api';

type SortField = 'name' | 'category' | 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

export default function KnowledgeBasePage() {
  const [items, setItems] = useState<KnowledgeBase[]>([]);
  const [filteredItems, setFilteredItems] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeBase | null>(null);

  // Filter and sort states
  const [searchName, setSearchName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    category: '',
    keywords: '',
    isActive: true,
  });

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    applyFilterAndSort();
  }, [items, searchName, filterCategory, sortField, sortOrder]);

  const loadItems = async () => {
    try {
      const data = await knowledgeBaseApi.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilterAndSort = () => {
    let result = [...items];

    // Filter by name
    if (searchName.trim()) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filter by category
    if (filterCategory.trim()) {
      result = result.filter(item =>
        item.category?.toLowerCase().includes(filterCategory.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      let compareResult = 0;

      switch (sortField) {
        case 'name':
          compareResult = a.name.localeCompare(b.name);
          break;
        case 'category':
          compareResult = (a.category || '').localeCompare(b.category || '');
          break;
        case 'createdAt':
          compareResult = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          compareResult = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? compareResult : -compareResult;
    });

    setFilteredItems(result);
  };

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return ' ↕';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  // Get unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(items.map(item => item.category).filter(Boolean)));

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      content: '',
      category: '',
      keywords: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (item: KnowledgeBase) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      content: item.content,
      category: item.category || '',
      keywords: item.keywords.join(', '),
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      description: formData.description,
      content: formData.content,
      category: formData.category || null,
      keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
      isActive: formData.isActive,
    };

    try {
      if (editingItem) {
        await knowledgeBaseApi.update(editingItem.id, data);
      } else {
        await knowledgeBaseApi.create(data);
      }
      await loadItems();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save knowledge base item:', error);
      alert('Failed to save item');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await knowledgeBaseApi.delete(id);
      await loadItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Knowledge Base</h1>
        <p>Manage customer service Q&A and documentation (BM25 searches content field)</p>
      </div>

      <div className="card">
        {/* Filter and Sort Controls */}
        <div style={{ padding: '20px', borderBottom: '1px solid #ecf0f1' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Search Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Filter by name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Filter Category</label>
              <select
                className="form-input"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat || ''}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Sort By</label>
              <select
                className="form-input"
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                style={{ minWidth: '150px' }}
              >
                <option value="updatedAt">Last Updated</option>
                <option value="createdAt">Created Time</option>
                <option value="name">Name</option>
                <option value="category">Category</option>
              </select>
            </div>
            <div>
              <label className="form-label">Order</label>
              <select
                className="form-input"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                style={{ minWidth: '120px' }}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleCreate}>
              + Add New Entry
            </button>
          </div>
          <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
            Showing {filteredItems.length} of {items.length} entries
          </div>
        </div>

        {/* Knowledge Base Table */}
        <table className="table">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSortChange('name')}>
                Name{getSortIcon('name')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSortChange('category')}>
                Category{getSortIcon('category')}
              </th>
              <th>Keywords</th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSortChange('updatedAt')}>
                Updated{getSortIcon('updatedAt')}
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category || '-'}</td>
                <td>{item.keywords.slice(0, 3).join(', ')}{item.keywords.length > 3 ? '...' : ''}</td>
                <td>{new Date(item.updatedAt).toLocaleString()}</td>
                <td>
                  <span style={{ color: item.isActive ? '#2ecc71' : '#95a5a6' }}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-secondary" onClick={() => handleEdit(item)}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredItems.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            {searchName || filterCategory ? 'No entries found matching your filters' : 'No knowledge base entries yet. Click "Add New Entry" to create one.'}
          </p>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingItem ? 'Edit Knowledge Entry' : 'Create Knowledge Entry'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Description * (used for vector search)
                </label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description that will be used for semantic search"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category (for filtering)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., shipping, returns, product"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Keywords (comma-separated, optional tags for filtering)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="退貨, 退款, refund, return"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Content * (BM25 searches this field)</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '200px' }}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Full content, Q&A, documentation, etc."
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
