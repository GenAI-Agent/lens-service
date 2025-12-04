import { useState, useRef, useEffect } from 'react';
import { AgentPanel } from '../../../packages/agent-panel/agent-panel';

// Fixed test credentials
const TEST_USER_ID = 'test-admin-user';

export default function TestAgent() {
  const [targetUrl, setTargetUrl] = useState('https://www.ask-lens.ai/en');
  const [loadedUrl, setLoadedUrl] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const agentPanelRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Agent Panel when component mounts
    initializeAgentPanel();

    return () => {
      // Cleanup
      if (agentPanelRef.current) {
        // Agent panel cleanup if needed
      }
    };
  }, []);

  const initializeAgentPanel = () => {
    // Create container for agent panel
    const container = document.getElementById('agent-panel-root');
    if (!container) {
      console.error('Agent panel root not found');
      return;
    }

    // Initialize Agent Panel
    const panel = new AgentPanel({
      apiUrl: window.location.origin,
      userId: TEST_USER_ID,
    });
    panel.mount(container);
    agentPanelRef.current = panel;
  };

  const handleLoadUrl = () => {
    if (!targetUrl) return;
    setLoadedUrl(targetUrl);
  };

  const handleResetSession = async () => {
    try {
      const response = await fetch('/api/admin/test-agent/reset-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: TEST_USER_ID }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset session');
      }

      // Reload agent panel
      window.location.reload();
    } catch (error) {
      console.error('[TestAgent] Failed to reset session:', error);
      alert('Failed to reset session: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Top Control Bar */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          zIndex: 1000
        }}
      >
        {/* Left: Title and Back button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #FF9A56 0%, #FF7F50 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Test Agent
          </div>

          <button
            onClick={() => window.location.href = '/admin'}
            style={{
              padding: '8px 16px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '10px',
              background: 'white',
              color: '#333',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
              e.currentTarget.style.borderColor = '#FF9A56';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Center: URL input and Load button */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example.com"
            style={{
              width: '400px',
              padding: '10px 16px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#FF9A56';
              e.target.style.boxShadow = '0 0 0 3px rgba(255, 154, 86, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
              e.target.style.boxShadow = 'none';
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleLoadUrl();
              }
            }}
          />

          <button
            onClick={handleLoadUrl}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FF9A56 0%, #FF7F50 100%)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 154, 86, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Load URL
          </button>
        </div>

        {/* Right: Reset Session button */}
        <div style={{ minWidth: '200px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleResetSession}
            style={{
              padding: '10px 24px',
              border: '1px solid rgba(255, 154, 86, 0.3)',
              borderRadius: '12px',
              background: 'transparent',
              color: '#FF9A56',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #FF9A56 0%, #FF7F50 100%)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = '#FF9A56';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#FF9A56';
              e.currentTarget.style.borderColor = 'rgba(255, 154, 86, 0.3)';
            }}
          >
            Reset Session
          </button>
        </div>
      </div>

      {/* Full Screen Iframe */}
      <div style={{
        flex: 1,
        position: 'relative',
        backgroundColor: '#f5f5f5'
      }}>
        {loadedUrl ? (
          <iframe
            ref={iframeRef}
            src={loadedUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block'
            }}
            title="Test Page"
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div
              style={{
                fontSize: '48px',
                opacity: 0.3
              }}
            >
              🌐
            </div>
            <div
              style={{
                fontSize: '18px',
                color: '#7f8c8d',
                fontWeight: '500'
              }}
            >
              Enter a URL above to start testing
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#95a5a6'
              }}
            >
              The Agent Panel will overlay on the page
            </div>
          </div>
        )}

        {/* Agent Panel Container */}
        <div id="agent-panel-root"></div>
      </div>
    </div>
  );
}
