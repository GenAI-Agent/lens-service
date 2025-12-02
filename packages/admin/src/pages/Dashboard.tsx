import React from 'react';

export default function Dashboard() {
  const stats = [
    { label: '今日對話', value: '0', change: '+0%' },
    { label: '知識庫文檔', value: '0', change: '' },
    { label: 'Telegram 配置', value: '0', change: '' },
    { label: 'Agent 測試', value: '0', change: '' },
  ];

  return (
    <div className="p-8 overflow-auto h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">儀表板</h1>
        <p className="text-gray-500 mt-1">歡迎使用 Lens Service 管理後台</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <p className="text-gray-500 text-sm">{stat.label}</p>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-bold text-gray-800">
                {stat.value}
              </span>
              {stat.change && (
                <span className="text-green-500 text-sm mb-1">
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/agent-tester"
            className="p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Agent 測試</p>
                <p className="text-sm text-gray-500">測試 Agent 操作網頁</p>
              </div>
            </div>
          </a>

          <a
            href="/knowledge-base"
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">新增知識</p>
                <p className="text-sm text-gray-500">添加客服 QA 內容</p>
              </div>
            </div>
          </a>

          <a
            href="/telegram"
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
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
              </div>
              <div>
                <p className="font-medium text-gray-800">設定 Telegram</p>
                <p className="text-sm text-gray-500">配置聯繫人帳號</p>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">系統資訊</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">版本</span>
            <span className="font-medium">v3.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">LLM Provider</span>
            <span className="font-medium">OpenAI (gpt-4o)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">資料庫</span>
            <span className="font-medium">PostgreSQL + pgvector</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Session Storage</span>
            <span className="font-medium">PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
