import { useState, useEffect } from 'react';

interface FormField {
  id: number;
  fieldKey: string;
  fieldType: string;
  label: { [key: string]: string };
  placeholder?: { [key: string]: string };
  isRequired: boolean;
  options?: any;
  validation?: any;
  order: number;
}

interface ProblemType {
  key: string;
  label: { [key: string]: string };
}

interface NotificationChannel {
  id?: string;
  type: 'telegram' | 'email';
  token?: string; // For Telegram
  chatId?: string; // For Telegram
  email?: string; // For Email
}

interface FormSettings {
  id: number;
  tenantId: string;
  enabledFields: string[];
  problemTypes: ProblemType[];
  notificationChannels: NotificationChannel[];
  messageLanguage: string; // Language for notification messages
  maxFileSize: number;
  allowedFileTypes: string[];
  isActive: boolean;
}

// Predefined problem types for checkbox selection
const PREDEFINED_PROBLEM_TYPES: ProblemType[] = [
  { key: 'accountIssue', label: { 'zh-TW': '帳戶問題', 'en-US': 'Account Issue' } },
  { key: 'techSupport', label: { 'zh-TW': '技術支援', 'en-US': 'Technical Support' } },
  { key: 'billing', label: { 'zh-TW': '帳單問題', 'en-US': 'Billing' } },
  { key: 'productInquiry', label: { 'zh-TW': '產品諮詢', 'en-US': 'Product Inquiry' } },
  { key: 'featureRequest', label: { 'zh-TW': '功能建議', 'en-US': 'Feature Request' } },
  { key: 'bugReport', label: { 'zh-TW': '錯誤回報', 'en-US': 'Bug Report' } },
  { key: 'refund', label: { 'zh-TW': '退款申請', 'en-US': 'Refund Request' } },
  { key: 'partnership', label: { 'zh-TW': '商務合作', 'en-US': 'Partnership' } },
  { key: 'other', label: { 'zh-TW': '其他', 'en-US': 'Other' } },
];

// Common MIME types for checkbox selection
const COMMON_MIME_TYPES = [
  { value: 'image/jpeg', label: 'JPEG 圖片' },
  { value: 'image/png', label: 'PNG 圖片' },
  { value: 'image/gif', label: 'GIF 圖片' },
  { value: 'image/webp', label: 'WebP 圖片' },
  { value: 'application/pdf', label: 'PDF 文件' },
  { value: 'application/msword', label: 'Word 文件 (.doc)' },
  { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word 文件 (.docx)' },
  { value: 'application/vnd.ms-excel', label: 'Excel 文件 (.xls)' },
  { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel 文件 (.xlsx)' },
  { value: 'text/plain', label: '純文字檔' },
  { value: 'application/zip', label: 'ZIP 壓縮檔' },
  { value: 'application/x-rar-compressed', label: 'RAR 壓縮檔' },
];

export default function FormSettings() {
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [settings, setSettings] = useState<FormSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [fieldsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/contact-form-fields'),
        fetch('/api/admin/contact-form-settings'),
      ]);

      if (fieldsRes.ok) {
        const fieldsData = await fieldsRes.json();
        setFormFields(fieldsData);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Failed to load form settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/contact-form-settings', {
        method: settings.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      alert('設定儲存成功！');
      await loadData();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('儲存失敗: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const toggleField = (fieldKey: string) => {
    if (!settings) return;

    const enabledFields = settings.enabledFields.includes(fieldKey)
      ? settings.enabledFields.filter(k => k !== fieldKey)
      : [...settings.enabledFields, fieldKey];

    setSettings({ ...settings, enabledFields });
  };

  const toggleProblemType = (problemType: ProblemType) => {
    if (!settings) return;

    const isEnabled = settings.problemTypes.some(pt => pt.key === problemType.key);

    const problemTypes = isEnabled
      ? settings.problemTypes.filter(pt => pt.key !== problemType.key)
      : [...settings.problemTypes, problemType];

    setSettings({ ...settings, problemTypes });
  };

  const toggleMimeType = (mimeType: string) => {
    if (!settings) return;

    const allowedTypes = settings.allowedFileTypes.includes(mimeType)
      ? settings.allowedFileTypes.filter(t => t !== mimeType)
      : [...settings.allowedFileTypes, mimeType];

    setSettings({ ...settings, allowedFileTypes: allowedTypes });
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>載入中...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div style={{ padding: '24px' }}>
        <h2>表單設定</h2>
        <p>尚未建立設定，請建立初始設定。</p>
        <button
          onClick={() => {
            setSettings({
              id: 0,
              tenantId: 'default',
              enabledFields: ['name', 'email', 'problemType', 'message'],
              problemTypes: [
                PREDEFINED_PROBLEM_TYPES[0], // accountIssue
                PREDEFINED_PROBLEM_TYPES[1], // techSupport
                PREDEFINED_PROBLEM_TYPES[2], // billing
                PREDEFINED_PROBLEM_TYPES[8], // other
              ],
              notificationChannels: [],
              messageLanguage: 'zh-TW',
              maxFileSize: 10485760,
              allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
              isActive: true,
            });
          }}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #FF9A56 0%, #FF7F50 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          建立初始設定
        </button>
      </div>
    );
  }

  const isProblemTypeEnabled = (key: string) => {
    return settings.problemTypes.some(pt => pt.key === key);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>表單設定</h2>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          style={{
            padding: '10px 24px',
            background: saving ? '#ccc' : 'linear-gradient(135deg, #FF9A56 0%, #FF7F50 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          {saving ? '儲存中...' : '儲存設定'}
        </button>
      </div>

      {/* Enabled Fields Section */}
      <div style={{ marginBottom: '32px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0 }}>啟用的表單欄位</h3>
        <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px 0' }}>
          勾選要在客服表單中顯示的欄位
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
          {formFields.map(field => (
            <label
              key={field.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                background: settings.enabledFields.includes(field.fieldKey) ? '#f0f9ff' : 'white',
              }}
            >
              <input
                type="checkbox"
                checked={settings.enabledFields.includes(field.fieldKey)}
                onChange={() => toggleField(field.fieldKey)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500' }}>{field.label['zh-TW'] || field.fieldKey}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>({field.fieldType})</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Problem Types Section */}
      <div style={{ marginBottom: '32px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0 }}>問題類型選項</h3>
        <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px 0' }}>
          勾選要在「問題類型」下拉選單中顯示的選項
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {PREDEFINED_PROBLEM_TYPES.map((pt) => (
            <label
              key={pt.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                background: isProblemTypeEnabled(pt.key) ? '#f0f9ff' : 'white',
              }}
            >
              <input
                type="checkbox"
                checked={isProblemTypeEnabled(pt.key)}
                onChange={() => toggleProblemType(pt)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500' }}>{pt.label['zh-TW']}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{pt.label['en-US']}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Notification Settings */}
      <div style={{ marginBottom: '32px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0 }}>通知設定</h3>
        <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px 0' }}>
          訊息會自動包含所有已啟用的表單欄位資料
        </p>

        {/* Message Language */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            訊息語言
          </label>
          <select
            value={settings.messageLanguage}
            onChange={(e) => setSettings({ ...settings, messageLanguage: e.target.value })}
            style={{
              padding: '8px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px',
              width: '200px',
            }}
          >
            <option value="zh-TW">繁體中文</option>
            <option value="en-US">English</option>
          </select>
        </div>

        {/* Notification Channels */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label style={{ fontWeight: '500' }}>通知渠道</label>
            <button
              onClick={() => {
                const newChannel: NotificationChannel = {
                  id: Date.now().toString(),
                  type: 'telegram',
                  token: '',
                  chatId: '',
                };
                setSettings({ ...settings, notificationChannels: [...settings.notificationChannels, newChannel] });
              }}
              style={{
                padding: '6px 12px',
                background: '#00d9f5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              + 新增通知渠道
            </button>
          </div>

          {settings.notificationChannels.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999', background: '#f9f9f9', borderRadius: '8px' }}>
              尚未設定任何通知渠道，點擊上方按鈕新增
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {settings.notificationChannels.map((channel, index) => (
                <div key={channel.id || index} style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fafafa' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {/* Channel Type */}
                    <div style={{ flex: '0 0 120px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>類型</label>
                      <select
                        value={channel.type}
                        onChange={(e) => {
                          const updated = [...settings.notificationChannels];
                          updated[index] = { ...updated[index], type: e.target.value as 'telegram' | 'email' };
                          setSettings({ ...settings, notificationChannels: updated });
                        }}
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          fontSize: '13px',
                          width: '100%',
                        }}
                      >
                        <option value="telegram">Telegram</option>
                        <option value="email">Email</option>
                      </select>
                    </div>

                    {/* Channel-specific fields */}
                    {channel.type === 'telegram' ? (
                      <>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Bot Token</label>
                          <input
                            type="text"
                            value={channel.token || ''}
                            onChange={(e) => {
                              const updated = [...settings.notificationChannels];
                              updated[index] = { ...updated[index], token: e.target.value };
                              setSettings({ ...settings, notificationChannels: updated });
                            }}
                            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                            style={{
                              padding: '6px 8px',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '13px',
                              width: '100%',
                            }}
                          />
                        </div>
                        <div style={{ flex: '0 0 180px' }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Chat ID</label>
                          <input
                            type="text"
                            value={channel.chatId || ''}
                            onChange={(e) => {
                              const updated = [...settings.notificationChannels];
                              updated[index] = { ...updated[index], chatId: e.target.value };
                              setSettings({ ...settings, notificationChannels: updated });
                            }}
                            placeholder="-1001234567890"
                            style={{
                              padding: '6px 8px',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '13px',
                              width: '100%',
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Email 地址</label>
                        <input
                          type="email"
                          value={channel.email || ''}
                          onChange={(e) => {
                            const updated = [...settings.notificationChannels];
                            updated[index] = { ...updated[index], email: e.target.value };
                            setSettings({ ...settings, notificationChannels: updated });
                          }}
                          placeholder="support@example.com"
                          style={{
                            padding: '6px 8px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            fontSize: '13px',
                            width: '100%',
                          }}
                        />
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        const updated = settings.notificationChannels.filter((_, i) => i !== index);
                        setSettings({ ...settings, notificationChannels: updated });
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#ff5252',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        marginTop: '20px',
                      }}
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File Upload Settings */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0 }}>檔案上傳設定</h3>
        <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px 0' }}>
          這些設定在啟用「檔案上傳」欄位時生效
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            最大檔案大小 (MB)
          </label>
          <input
            type="number"
            value={settings.maxFileSize / 1048576}
            onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) * 1048576 })}
            style={{
              padding: '8px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px',
              width: '200px',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500' }}>
            允許的檔案類型
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
            {COMMON_MIME_TYPES.map((mimeType) => (
              <label
                key={mimeType.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: settings.allowedFileTypes.includes(mimeType.value) ? '#f0f9ff' : 'white',
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.allowedFileTypes.includes(mimeType.value)}
                  onChange={() => toggleMimeType(mimeType.value)}
                />
                <span style={{ fontSize: '14px' }}>{mimeType.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
