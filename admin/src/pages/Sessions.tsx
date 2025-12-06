import { useEffect, useState } from 'react';
import { sessionsApi, Session, Message } from '../api';

type SortField = 'createdAt' | 'userId' | 'messageCount';
type SortOrder = 'asc' | 'desc';

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Filter and sort states
  const [searchUserId, setSearchUserId] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    applyFilterAndSort();
  }, [sessions, searchUserId, sortField, sortOrder]);

  const loadSessions = async () => {
    try {
      const data = await sessionsApi.getAll();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilterAndSort = () => {
    let result = [...sessions];

    // Filter by userId
    if (searchUserId.trim()) {
      result = result.filter(s =>
        s.userId.toLowerCase().includes(searchUserId.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      let compareResult = 0;

      switch (sortField) {
        case 'createdAt':
          compareResult = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'userId':
          compareResult = a.userId.localeCompare(b.userId);
          break;
        case 'messageCount':
          compareResult = (a._count?.messages || 0) - (b._count?.messages || 0);
          break;
      }

      return sortOrder === 'asc' ? compareResult : -compareResult;
    });

    setFilteredSessions(result);
  };

  const loadMessages = async (session: Session) => {
    try {
      const data = await sessionsApi.getMessages(session.id);

      // Find the index of the LAST Memory Summary
      let lastMemorySummaryIndex = -1;
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].role === 'system' && data[i].content.startsWith('[Memory Summary]')) {
          lastMemorySummaryIndex = i;
          break;
        }
      }

      // Only show messages from the last Memory Summary onwards
      const visibleMessages = lastMemorySummaryIndex >= 0
        ? data.slice(lastMemorySummaryIndex)
        : data;

      setMessages(visibleMessages);
      setSelectedSession(session);
      setShowMessageModal(true);
    } catch (error) {
      console.error('Failed to load messages:', error);
      alert('Failed to load messages');
    }
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

  if (loading) return <div className="lens-os-admin-loading">Loading...</div>;

  return (
    <div>
      <div className="lens-os-admin-card">
        {/* Filter and Sort Controls */}
        <div style={{ padding: '20px', borderBottom: '1px solid #ecf0f1' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="lens-os-admin-form-label">Search User ID</label>
              <input
                type="text"
                className="lens-os-admin-form-input"
                placeholder="Filter by user ID..."
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
              />
            </div>
            <div>
              <label className="lens-os-admin-form-label">Sort By</label>
              <select
                className="lens-os-admin-form-input"
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                style={{ minWidth: '150px' }}
              >
                <option value="createdAt">Created Time</option>
                <option value="userId">User ID</option>
                <option value="messageCount">Message Count</option>
              </select>
            </div>
            <div>
              <label className="lens-os-admin-form-label">Order</label>
              <select
                className="lens-os-admin-form-input"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                style={{ minWidth: '120px' }}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <table className="lens-os-admin-table">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSortChange('userId')}>
                User ID{getSortIcon('userId')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSortChange('createdAt')}>
                Created{getSortIcon('createdAt')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSortChange('messageCount')}>
                Messages{getSortIcon('messageCount')}
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((session) => (
              <tr key={session.id}>
                <td>{session.userId}</td>
                <td>{new Date(session.createdAt).toLocaleString()}</td>
                <td>{session._count?.messages || 0}</td>
                <td>
                  <span style={{ color: session.isActive ? '#2ecc71' : '#95a5a6' }}>
                    {session.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="lens-os-admin-table-actions">
                    <button
                      className="lens-os-admin-btn lens-os-admin-btn-secondary"
                      onClick={() => loadMessages(session)}
                    >
                      View Messages
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSessions.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            {searchUserId ? 'No sessions found matching your search' : 'No sessions yet'}
          </p>
        )}
      </div>

      {/* Messages Modal */}
      {showMessageModal && selectedSession && (
        <div className="lens-os-admin-modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="lens-os-admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="lens-os-admin-modal-header">
              <h2 className="lens-os-admin-modal-title">Messages - {selectedSession.userId}</h2>
              <button className="lens-os-admin-modal-close" onClick={() => setShowMessageModal(false)}>×</button>
            </div>

            <div style={{ maxHeight: '60vh', overflow: 'auto', padding: '20px' }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    marginBottom: '15px',
                    padding: '12px',
                    backgroundColor:
                      msg.role === 'user'
                        ? '#e3f2fd'
                        : msg.role === 'assistant'
                        ? '#f3e5f5'
                        : '#f5f5f5',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '8px' }}>
                    <strong style={{ textTransform: 'capitalize' }}>{msg.role}</strong>
                    {' • '}
                    {new Date(msg.timestamp).toLocaleString()}
                    {msg.isCompacted && <span style={{ color: '#e67e22' }}> • Compacted</span>}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{msg.content}</div>
                </div>
              ))}

              {messages.length === 0 && (
                <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px' }}>
                  No messages in this session
                </p>
              )}
            </div>

            <div className="lens-os-admin-modal-footer">
              <button className="lens-os-admin-btn lens-os-admin-btn-secondary" onClick={() => setShowMessageModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
