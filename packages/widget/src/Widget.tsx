import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    pageId?: string;
  };
}

interface WidgetConfig {
  apiUrl?: string;
  token?: string;
  title?: string;
  placeholder?: string;
  primaryColor?: string;
}

export function Widget() {
  // Parse config from URL params
  const params = new URLSearchParams(window.location.search);
  const config: WidgetConfig = {
    apiUrl: params.get('apiUrl') || 'http://localhost:3000/api',
    token: params.get('token') || '',
    title: params.get('title') || 'TzAI 智能客服',
    placeholder: params.get('placeholder') || '請輸入您的問題...',
    primaryColor: params.get('primaryColor') || '#007bff',
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          metadata: {
            pageId: data.metadata?.pageId,
          },
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setConversationId(data.conversationId);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: '抱歉，發生錯誤，請稍後再試。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = (msg: Message) => {
    const isUser = msg.role === 'user';

    return (
      <div
        key={msg.id}
        className={`message ${isUser ? 'message-user' : 'message-assistant'}`}
      >
        <div className="message-content">
          {msg.content}
          {msg.metadata?.pageId && (
            <a
              href={`${config.apiUrl}/pages/${msg.metadata.pageId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="page-link"
            >
              查看詳細內容 →
            </a>
          )}
        </div>
        <div className="message-time">
          {msg.timestamp.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="widget-container" style={{ '--primary-color': config.primaryColor } as React.CSSProperties}>
      {/* Header */}
      <div className="widget-header">
        <div className="widget-title">{config.title}</div>
        <div className="widget-status">
          <span className="status-dot" />
          在線
        </div>
      </div>

      {/* Messages */}
      <div className="widget-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <div className="welcome-icon">👋</div>
            <div className="welcome-text">
              您好！我是 TzAI 智能客服。
              <br />
              有什麼可以幫助您的嗎？
            </div>
          </div>
        )}
        {messages.map(renderMessage)}
        {isLoading && (
          <div className="message message-assistant">
            <div className="message-content typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="widget-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={config.placeholder}
          rows={1}
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={!input.trim() || isLoading}>
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path
              fill="currentColor"
              d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
            />
          </svg>
        </button>
      </div>

      {/* Footer */}
      <div className="widget-footer">
        Powered by Lens Service v3
      </div>
    </div>
  );
}
