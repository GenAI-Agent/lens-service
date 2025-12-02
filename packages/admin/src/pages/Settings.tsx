import React, { useState } from 'react';

export default function Settings() {
  const [llmProvider, setLlmProvider] = useState('openai');
  const [openaiKey, setOpenaiKey] = useState('');
  const [model, setModel] = useState('gpt-4o');
  const [planApproval, setPlanApproval] = useState(true);
  const [contactFeature, setContactFeature] = useState(true);

  const handleSave = () => {
    // TODO: Save to backend
    alert('設定已儲存');
  };

  return (
    <div className="p-8 overflow-auto h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">系統設定</h1>
        <p className="text-gray-500 mt-1">配置 LLM、Widget 和其他系統選項</p>
      </div>

      <div className="space-y-8 max-w-2xl">
        {/* LLM Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            LLM 設定
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider
              </label>
              <select
                value={llmProvider}
                onChange={(e) => setLlmProvider(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="sk-..."
              />
              <p className="text-xs text-gray-500 mt-1">
                可在 .env 中設定，此處覆蓋環境變數
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            功能開關
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">計劃確認流程</h3>
                <p className="text-sm text-gray-500">
                  操作網頁前需要用戶確認計劃
                </p>
              </div>
              <button
                onClick={() => setPlanApproval(!planApproval)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  planApproval ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    planApproval ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">聯繫功能</h3>
                <p className="text-sm text-gray-500">
                  允許用戶使用 @ 聯繫指定人員
                </p>
              </div>
              <button
                onClick={() => setContactFeature(!contactFeature)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  contactFeature ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    contactFeature ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Database Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            資料庫資訊
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">連接狀態</span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="font-medium text-green-600">已連接</span>
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">資料庫類型</span>
              <span className="font-medium">PostgreSQL + pgvector</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">知識庫文檔數</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Session 數量</span>
              <span className="font-medium">0</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-4">
            危險區域
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-800">清除所有 Session</h3>
                <p className="text-sm text-red-600">
                  刪除所有對話記錄（不可恢復）
                </p>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
                清除
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-800">重置系統</h3>
                <p className="text-sm text-red-600">
                  清除所有資料並重置為初始狀態
                </p>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
                重置
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            儲存設定
          </button>
        </div>
      </div>
    </div>
  );
}
