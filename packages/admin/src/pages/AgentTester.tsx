import React, { useState, useRef, useCallback, useEffect } from 'react';

// Types
interface PlanStep {
  stepNumber: number;
  action: string;
  actionType: string;
  target?: string;
  expectedResult: string;
  status?: 'pending' | 'executing' | 'completed' | 'failed';
}

interface AgentPlan {
  id: string;
  summary: string;
  steps: PlanStep[];
  estimatedDuration: string;
  risks: string[];
}

interface ToolCall {
  id: string;
  tool: string;
  params: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'success' | 'error';
  timestamp: Date;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export default function AgentTester() {
  // State
  const [targetUrl, setTargetUrl] = useState('');
  const [loadedUrl, setLoadedUrl] = useState('');
  const [userId, setUserId] = useState('test-user-001');
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'plan' | 'tools'>('chat');
  const [panelWidth, setPanelWidth] = useState(450);

  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef(false);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse]);

  // Load website
  const handleLoadWebsite = () => {
    if (targetUrl) {
      // Ensure URL has protocol
      let url = targetUrl;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      setLoadedUrl(url);
    }
  };

  // Handle query submission
  const handleSubmit = async () => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);
    setStreamingResponse('');

    try {
      // TODO: Call actual API to generate plan
      // For now, simulate with mock data
      await simulateGeneratePlan(userMessage.content);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: '抱歉，發生錯誤，請稍後再試。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate plan generation (TODO: Replace with actual API)
  const simulateGeneratePlan = async (userQuery: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if query needs plan approval
    const needsPlan = userQuery.includes('訂單') ||
                      userQuery.includes('操作') ||
                      userQuery.includes('申請') ||
                      userQuery.includes('填寫');

    if (needsPlan) {
      // Generate a mock plan
      const mockPlan: AgentPlan = {
        id: `plan-${Date.now()}`,
        summary: `執行: ${userQuery}`,
        steps: [
          {
            stepNumber: 1,
            action: '擷取當前頁面狀態',
            actionType: 'capture_state',
            expectedResult: '獲取頁面可互動元素',
            status: 'pending',
          },
          {
            stepNumber: 2,
            action: '尋找相關按鈕或連結',
            actionType: 'find_element',
            target: '目標元素',
            expectedResult: '找到可點擊元素',
            status: 'pending',
          },
          {
            stepNumber: 3,
            action: '執行操作',
            actionType: 'click',
            target: '按鈕',
            expectedResult: '頁面跳轉或更新',
            status: 'pending',
          },
        ],
        estimatedDuration: '約 30 秒',
        risks: ['可能需要登入', '頁面結構可能變化'],
      };

      setPlan(mockPlan);
      setActiveTab('plan');

      const planMessage: Message = {
        id: `msg-${Date.now()}-plan`,
        role: 'assistant',
        content: `我已生成操作計劃，請確認後執行。\n\n計劃摘要: ${mockPlan.summary}\n預估時間: ${mockPlan.estimatedDuration}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, planMessage]);
    } else {
      // Direct response without plan
      const response: Message = {
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: `收到您的問題: "${userQuery}"\n\n這是一個模擬回應。實際功能將在 API 完成後啟用。`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, response]);
    }
  };

  // Execute plan
  const handleExecutePlan = async () => {
    if (!plan || isExecuting) return;

    setIsExecuting(true);
    setActiveTab('tools');

    // Simulate execution
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];

      // Update step status to executing
      setPlan(prev => {
        if (!prev) return prev;
        const newSteps = [...prev.steps];
        newSteps[i] = { ...newSteps[i], status: 'executing' };
        return { ...prev, steps: newSteps };
      });

      // Add tool call
      const toolCall: ToolCall = {
        id: `tool-${Date.now()}-${i}`,
        tool: step.actionType,
        params: { target: step.target },
        status: 'pending',
        timestamp: new Date(),
      };
      setToolCalls(prev => [...prev, toolCall]);

      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update tool call status
      setToolCalls(prev =>
        prev.map(tc =>
          tc.id === toolCall.id
            ? { ...tc, status: 'success', result: { success: true } }
            : tc
        )
      );

      // Update step status to completed
      setPlan(prev => {
        if (!prev) return prev;
        const newSteps = [...prev.steps];
        newSteps[i] = { ...newSteps[i], status: 'completed' };
        return { ...prev, steps: newSteps };
      });
    }

    // Final response
    const completionMessage: Message = {
      id: `msg-${Date.now()}-complete`,
      role: 'assistant',
      content: '操作已完成！所有步驟都執行成功。',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, completionMessage]);

    setIsExecuting(false);
    setPlan(null);
  };

  // Cancel plan
  const handleCancelPlan = () => {
    setPlan(null);
    const cancelMessage: Message = {
      id: `msg-${Date.now()}-cancel`,
      role: 'assistant',
      content: '計劃已取消。有什麼其他我可以幫助您的嗎？',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  // Panel resizing
  const handleMouseDown = useCallback(() => {
    resizingRef.current = true;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const newWidth = e.clientX;
      if (newWidth >= 350 && newWidth <= 700) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      resizingRef.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="flex h-full">
      {/* Left Panel - Agent */}
      <div
        className="flex flex-col bg-white border-r border-gray-200"
        style={{ width: panelWidth }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Agent 測試</h2>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="用戶 ID"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(['chat', 'plan', 'tools'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'chat' && '對話'}
              {tab === 'plan' && '計劃'}
              {tab === 'tools' && 'Tools'}
              {tab === 'plan' && plan && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-primary-100 text-primary-600 rounded-full">
                  待確認
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <p>輸入網站 URL 並發送訊息開始測試</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`${
                      msg.role === 'user' ? 'ml-8' : 'mr-8'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
                {streamingResponse && (
                  <div className="mr-8">
                    <div className="p-3 rounded-lg bg-gray-100">
                      <p className="streaming-cursor">{streamingResponse}</p>
                    </div>
                  </div>
                )}
                {isLoading && !streamingResponse && (
                  <div className="mr-8">
                    <div className="p-3 rounded-lg bg-gray-100">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}

          {/* Plan Tab */}
          {activeTab === 'plan' && (
            <div className="flex-1 overflow-y-auto p-4">
              {plan ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-semibold text-yellow-800">
                      {plan.summary}
                    </h3>
                    <p className="text-sm text-yellow-600 mt-1">
                      預估時間: {plan.estimatedDuration}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">執行步驟:</h4>
                    {plan.steps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className={`plan-step ${step.status || ''}`}
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                          {step.status === 'completed' ? '✓' : step.stepNumber}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{step.action}</p>
                          <p className="text-sm text-gray-500">
                            {step.expectedResult}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {plan.risks.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800">潛在風險:</h4>
                      <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
                        {plan.risks.map((risk, i) => (
                          <li key={i}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleExecutePlan}
                      disabled={isExecuting}
                      className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExecuting ? '執行中...' : '確認執行'}
                    </button>
                    <button
                      onClick={handleCancelPlan}
                      disabled={isExecuting}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <p>暫無計劃</p>
                </div>
              )}
            </div>
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div className="flex-1 overflow-y-auto p-4">
              {toolCalls.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <p>暫無 Tool 呼叫記錄</p>
                </div>
              ) : (
                <div className="space-y-3 tool-call-log">
                  {toolCalls.map((tc) => (
                    <div
                      key={tc.id}
                      className={`tool-call-item ${tc.status}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">
                          {tc.tool}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            tc.status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : tc.status === 'error'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {tc.status}
                        </span>
                      </div>
                      <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                        {JSON.stringify(tc.params, null, 2)}
                      </pre>
                      {tc.result && (
                        <pre className="text-xs text-green-600 mt-1 overflow-x-auto">
                          → {JSON.stringify(tc.result)}
                        </pre>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {tc.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="輸入您的問題或指令..."
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              disabled={isLoading || isExecuting}
            />
            <button
              onClick={handleSubmit}
              disabled={!query.trim() || isLoading || isExecuting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Resizable Divider */}
      <div
        className="resizable-divider"
        onMouseDown={handleMouseDown}
      />

      {/* Right Panel - Website */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* URL Bar */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLoadWebsite();
                }
              }}
              placeholder="輸入要測試的網站 URL..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleLoadWebsite}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              載入
            </button>
          </div>
          {loadedUrl && (
            <p className="text-sm text-gray-500 mt-2">
              目前載入: {loadedUrl}
            </p>
          )}
        </div>

        {/* iframe Container */}
        <div className="flex-1 relative">
          {loadedUrl ? (
            <iframe
              ref={iframeRef}
              src={loadedUrl}
              className="absolute inset-0 w-full h-full border-0"
              title="Target Website"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                <p className="text-lg">輸入網址載入網站</p>
                <p className="text-sm mt-2">
                  載入後可以測試 Agent 如何操作目標網站
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
