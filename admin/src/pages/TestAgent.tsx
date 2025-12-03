import { useState, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface PromptLog {
  timestamp: string;
  systemPrompt: string;
  userMessage: string;
  context: string;
}

interface WebAction {
  type: string;
  target: string;
  description: string;
  timestamp: string;
}

export default function TestAgent() {
  // URL input
  const [targetUrl, setTargetUrl] = useState('https://example.com');
  const [loadedUrl, setLoadedUrl] = useState('');

  // Chat messages (right panel - what user sees)
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Prompt logs (left panel - what LLM sees)
  const [promptLogs, setPromptLogs] = useState<PromptLog[]>([]);

  // Web actions (middle panel overlay)
  const [webActions, setWebActions] = useState<WebAction[]>([]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoadUrl = () => {
    setLoadedUrl(targetUrl);
    setMessages([]);
    setPromptLogs([]);
    setWebActions([]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'admin-test',
          message: userMessage,
          currentUrl: loadedUrl || targetUrl,
          currentPage: {
            url: loadedUrl || targetUrl,
            title: 'Test Page',
            markdown: '# Test Environment',
            screenshot: '',
            actionableElements: [],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Log the prompt sent to LLM
      const promptLog: PromptLog = {
        timestamp: new Date().toLocaleTimeString(),
        systemPrompt: 'System: Customer service agent...',
        userMessage: userMessage,
        context: `URL: ${loadedUrl || targetUrl}`,
      };
      setPromptLogs((prev) => [...prev, promptLog]);

      // Handle SSE streaming
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6).trim();
            if (data === '[DONE]') break;

            try {
              const event = JSON.parse(data);

              if (event.type === 'text') {
                assistantMessage += event.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg && lastMsg.role === 'assistant') {
                    lastMsg.content = assistantMessage;
                  } else {
                    newMessages.push({ role: 'assistant', content: assistantMessage });
                  }
                  return newMessages;
                });
              } else if (event.type === 'tool_call') {
                const toolCall = event.toolCall;

                // Add to web actions if it's a web use action
                if (toolCall.name === 'web_use') {
                  const action: WebAction = {
                    type: toolCall.parameters.action || 'unknown',
                    target: toolCall.parameters.selector || '',
                    description: `${toolCall.parameters.action} on ${toolCall.parameters.selector}`,
                    timestamp: new Date().toLocaleTimeString(),
                  };
                  setWebActions((prev) => [...prev, action]);
                }

                setMessages((prev) => [
                  ...prev,
                  {
                    role: 'system',
                    content: `🔧 Tool: ${toolCall.name}\n${JSON.stringify(toolCall.parameters, null, 2)}`,
                  },
                ]);
              } else if (event.type === 'tool_result') {
                setMessages((prev) => [
                  ...prev,
                  {
                    role: 'system',
                    content: `✅ Result: ${event.toolResult.success ? 'Success' : 'Failed'}`,
                  },
                ]);
              } else if (event.type === 'error') {
                setMessages((prev) => [...prev, { role: 'system', content: `❌ Error: ${event.error}` }]);
              }
            } catch (error) {
              console.error('Parse SSE error:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Send message error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setPromptLogs([]);
    setWebActions([]);
  };

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '15px' }}>
        <h1>Test Agent</h1>
        <p>Test AI agent with live webpage interaction</p>
      </div>

      {/* URL Input */}
      <div className="card" style={{ marginBottom: '15px', padding: '15px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label className="form-label" style={{ marginBottom: 0, minWidth: '80px' }}>Target URL:</label>
          <input
            type="text"
            className="form-input"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example.com"
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleLoadUrl}>
            Load Page
          </button>
          <button className="btn btn-secondary" onClick={handleClear}>
            Clear All
          </button>
        </div>
      </div>

      {/* Three-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '15px', flex: 1, minHeight: 0 }}>

        {/* LEFT PANEL - Prompt Logs (What LLM sees) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="card-header" style={{ flexShrink: 0 }}>
            <div className="card-title">📝 LLM Prompt</div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '15px', backgroundColor: '#f8f9fa' }}>
            {promptLogs.map((log, idx) => (
              <div key={idx} style={{ marginBottom: '20px', fontSize: '12px', fontFamily: 'monospace' }}>
                <div style={{ color: '#7f8c8d', marginBottom: '5px' }}>[{log.timestamp}]</div>
                <div style={{ whiteSpace: 'pre-wrap', backgroundColor: '#fff', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                  <strong>System:</strong> {log.systemPrompt}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                  <strong>User:</strong> {log.userMessage}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', backgroundColor: '#fff', padding: '10px', borderRadius: '5px' }}>
                  <strong>Context:</strong> {log.context}
                </div>
              </div>
            ))}
            {promptLogs.length === 0 && (
              <p style={{ textAlign: 'center', color: '#7f8c8d', paddingTop: '50px' }}>
                Prompts sent to LLM will appear here
              </p>
            )}
          </div>
        </div>

        {/* MIDDLE PANEL - Webpage Preview */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>
          <div className="card-header" style={{ flexShrink: 0 }}>
            <div className="card-title">🌐 Webpage Preview</div>
            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>{loadedUrl || 'No page loaded'}</div>
          </div>

          {/* Web Actions Overlay */}
          {webActions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '60px',
              right: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '10px',
              borderRadius: '5px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              maxWidth: '200px',
              zIndex: 10,
              fontSize: '11px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🎬 Agent Actions</div>
              {webActions.slice(-5).map((action, idx) => (
                <div key={idx} style={{ marginBottom: '5px', padding: '5px', backgroundColor: '#e8f4f8', borderRadius: '3px' }}>
                  <div style={{ color: '#2196f3', fontWeight: 'bold' }}>{action.type}</div>
                  <div style={{ color: '#666' }}>{action.target}</div>
                  <div style={{ color: '#999', fontSize: '10px' }}>{action.timestamp}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ flex: 1, minHeight: 0, backgroundColor: '#f0f0f0' }}>
            {loadedUrl ? (
              <iframe
                ref={iframeRef}
                src={loadedUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: 'white'
                }}
                title="Target Webpage"
              />
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#7f8c8d'
              }}>
                Enter a URL and click "Load Page" to start testing
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - Chat (What user sees) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="card-header" style={{ flexShrink: 0 }}>
            <div className="card-title">💬 User Chat</div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: '15px', backgroundColor: '#f8f9fa' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '12px',
                  padding: '10px',
                  backgroundColor:
                    msg.role === 'user'
                      ? '#e3f2fd'
                      : msg.role === 'assistant'
                      ? '#f3e5f5'
                      : '#fff3cd',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '5px', color: '#666' }}>
                  {msg.role.toUpperCase()}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            ))}
            {messages.length === 0 && (
              <p style={{ textAlign: 'center', color: '#7f8c8d', paddingTop: '50px' }}>
                Chat messages will appear here
              </p>
            )}
          </div>

          {/* Input */}
          <div style={{ flexShrink: 0, padding: '15px', borderTop: '1px solid #ecf0f1' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <textarea
                className="form-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                rows={3}
                style={{ marginBottom: '10px', resize: 'none' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !input.trim()}
                style={{ width: '100%' }}
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
