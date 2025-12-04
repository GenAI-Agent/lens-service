import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Prompts from './pages/Prompts';
import Skills from './pages/Skills';
import KnowledgeBase from './pages/KnowledgeBase';
import Sessions from './pages/Sessions';
import TestAgent from './pages/TestAgent';
import Traces from './pages/Traces';

function App() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  // TestAgent page should be full screen without sidebar
  const isTestAgentPage = location.pathname === '/test-agent';

  if (isTestAgentPage) {
    return (
      <Routes>
        <Route path="/test-agent" element={<TestAgent />} />
      </Routes>
    );
  }

  return (
    <div className="lens-os-admin-layout">
      <aside className="lens-os-admin-sidebar">
        <div className="lens-os-admin-sidebar-header">
          <span>Lens Admin</span>
        </div>
        <nav>
          <ul className="lens-os-admin-sidebar-menu">
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
              <Link to="/traces" className={isActive('/traces')}>
                Traces
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

      <main className="lens-os-admin-main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/prompts" element={<Prompts />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/traces" element={<Traces />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
