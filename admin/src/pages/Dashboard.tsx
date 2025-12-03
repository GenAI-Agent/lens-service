import { useEffect, useState } from 'react';
import {
  sitePromptsApi,
  urlPromptsApi,
  skillsApi,
  knowledgeBaseApi,
  sessionsApi
} from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    sitePrompts: 0,
    urlPrompts: 0,
    skills: 0,
    knowledgeBase: 0,
    sessions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

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

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome to Lens Service Admin</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div className="card">
          <h3>Site Prompts</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#3498db' }}>
            {stats.sitePrompts}
          </p>
        </div>

        <div className="card">
          <h3>URL Prompts</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#2ecc71' }}>
            {stats.urlPrompts}
          </p>
        </div>

        <div className="card">
          <h3>Skills</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#9b59b6' }}>
            {stats.skills}
          </p>
        </div>

        <div className="card">
          <h3>Knowledge Base</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#e67e22' }}>
            {stats.knowledgeBase}
          </p>
        </div>

        <div className="card">
          <h3>Active Sessions</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#e74c3c' }}>
            {stats.sessions}
          </p>
        </div>
      </div>
    </div>
  );
}
