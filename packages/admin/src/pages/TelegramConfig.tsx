import React, { useState } from 'react';

interface TelegramConfig {
  id: string;
  name: string;
  botToken: string;
  chatId: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
}

export default function TelegramConfig() {
  const [configs, setConfigs] = useState<TelegramConfig[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<TelegramConfig | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    botToken: '',
    chatId: '',
    description: '',
  });

  const handleAddConfig = () => {
    const newConfig: TelegramConfig = {
      id: `tg-${Date.now()}`,
      ...formData,
      isActive: true,
      createdAt: new Date(),
    };
    setConfigs(prev => [...prev, newConfig]);
    setIsAddModalOpen(false);
    setFormData({ name: '', botToken: '', chatId: '', description: '' });
  };

  const handleUpdateConfig = () => {
    if (!editingConfig) return;
    setConfigs(prev =>
      prev.map(cfg =>
        cfg.id === editingConfig.id ? { ...cfg, ...formData } : cfg
      )
    );
    setEditingConfig(null);
    setFormData({ name: '', botToken: '', chatId: '', description: '' });
  };

  const handleDeleteConfig = (id: string) => {
    if (confirm('確定要刪除此配置嗎？')) {
      setConfigs(prev => prev.filter(cfg => cfg.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setConfigs(prev =>
      prev.map(cfg =>
        cfg.id === id ? { ...cfg, isActive: !cfg.isActive } : cfg
      )
    );
  };

  const handleTestConfig = async (config: TelegramConfig) => {
    setTestingId(config.id);
    try {
      // TODO: Call actual API to test
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`測試訊息已發送到 ${config.name}！`);
    } catch (error) {
      alert('發送失敗，請檢查配置是否正確。');
    } finally {
      setTestingId(null);
    }
  };

  const openEditModal = (config: TelegramConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      botToken: config.botToken,
      chatId: config.chatId,
      description: config.description,
    });
  };

  return (
    <div className="p-8 overflow-auto h-full">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Telegram 配置</h1>
          <p className="text-gray-500 mt-1">
            管理 Telegram 聯繫人，支援 @ 選擇發送訊息
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          新增聯繫人
        </button>
      </div>

      {/* Config List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configs.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <p className="text-lg text-gray-400">暫無 Telegram 配置</p>
            <p className="text-sm text-gray-400 mt-2">
              點擊「新增聯繫人」添加 Telegram Bot 配置
            </p>
          </div>
        ) : (
          configs.map(config => (
            <div
              key={config.id}
              className={`bg-white rounded-xl shadow-sm border p-6 ${
                config.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
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
                    <h3 className="font-semibold text-gray-800">
                      @{config.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {config.description || '無描述'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(config.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.isActive ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="text-sm text-gray-500 space-y-1 mb-4">
                <p>
                  <span className="font-medium">Chat ID:</span> {config.chatId}
                </p>
                <p>
                  <span className="font-medium">Bot Token:</span>{' '}
                  {config.botToken.slice(0, 10)}...
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleTestConfig(config)}
                  disabled={testingId === config.id || !config.isActive}
                  className="flex-1 px-3 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {testingId === config.id ? '發送中...' : '測試發送'}
                </button>
                <button
                  onClick={() => openEditModal(config)}
                  className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteConfig(config.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Usage Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 mb-2">使用說明</h3>
        <div className="text-sm text-blue-600 space-y-2">
          <p>
            1. 在 Telegram 中創建 Bot（使用 @BotFather），獲取 Bot Token
          </p>
          <p>
            2. 將 Bot 加入群組或私聊，獲取 Chat ID
          </p>
          <p>
            3. 配置完成後，用戶可以在對話中使用 <code className="bg-blue-100 px-1 rounded">@聯繫人名稱</code> 發送訊息
          </p>
          <p>
            例如：<code className="bg-blue-100 px-1 rounded">請幫我聯繫 @客服小明</code>
          </p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(isAddModalOpen || editingConfig) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingConfig ? '編輯聯繫人' : '新增聯繫人'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="例如: 客服小明"
                />
                <p className="text-xs text-gray-500 mt-1">
                  用戶將使用 @{formData.name || '名稱'} 發送訊息
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Token <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.botToken}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, botToken: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="從 @BotFather 獲取"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chat ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.chatId}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, chatId: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="群組或私聊的 Chat ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="例如: 處理訂單問題"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingConfig(null);
                  setFormData({
                    name: '',
                    botToken: '',
                    chatId: '',
                    description: '',
                  });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={editingConfig ? handleUpdateConfig : handleAddConfig}
                disabled={!formData.name || !formData.botToken || !formData.chatId}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingConfig ? '更新' : '新增'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
