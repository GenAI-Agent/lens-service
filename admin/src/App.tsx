import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Prompts from './pages/Prompts';
import Skills from './pages/Skills';
import KnowledgeBase from './pages/KnowledgeBase';
import Sessions from './pages/Sessions';
import TestAgent from './pages/TestAgent';

function App() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">Lens Admin</div>
        <nav>
          <ul className="sidebar-menu">
            <li>
              <Link to="/" className={isActive('/')}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/prompts" className={isActive('/prompts')}>
                Prompts
              </Link>
            </li>
            <li>
              <Link to="/skills" className={isActive('/skills')}>
                Skills
              </Link>
            </li>
            <li>
              <Link to="/knowledge-base" className={isActive('/knowledge-base')}>
                Knowledge Base
              </Link>
            </li>
            <li>
              <Link to="/sessions" className={isActive('/sessions')}>
                Sessions
              </Link>
            </li>
            <li>
              <Link to="/test-agent" className={isActive('/test-agent')}>
                Test Agent
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/prompts" element={<Prompts />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/test-agent" element={<TestAgent />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
