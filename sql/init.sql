-- Lens Service 資料庫初始化腳本
-- 此腳本會創建所有必要的表格並插入預設數據

-- 創建對話表
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  conversation_id VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建手動索引表
CREATE TABLE IF NOT EXISTS manual_indexes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建系統設定表
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建管理員用戶表
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入預設系統設定
INSERT INTO settings (key, value) VALUES 
  ('system_prompt', '你是一個專業的客服助理，請根據提供的資料回答用戶問題。如果沒有相關資料，請告知用戶會轉交給人工客服處理。'),
  ('default_reply', '此問題我們會在 3 小時內給予回覆，請稍候。'),
  ('llms_txt_url', '')
ON CONFLICT (key) DO NOTHING;

-- 插入預設管理員帳號
INSERT INTO admin_users (username, password, email) VALUES 
  ('lens', '1234', 'lens@lens-service.com'),
  ('admin', 'admin123', 'admin@lens-service.com')
ON CONFLICT (username) DO NOTHING;

-- 插入範例手動索引
INSERT INTO manual_indexes (title, description, url, content) VALUES 
  ('客服聯絡方式', '提供客服聯絡資訊', '', '您可以透過以下方式聯絡我們的客服團隊：電話 0800-123-456（週一至週五 9:00-18:00），Email: support@example.com，或使用網站右下角的即時聊天功能。'),
  ('產品價格資訊', '產品定價方案說明', '', '我們的產品提供三種方案：基礎版每月 $99，專業版每月 $299，企業版每月 $999。所有方案都包含 7 天免費試用。')
ON CONFLICT DO NOTHING;

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_conversations_conversation_id ON conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_manual_indexes_title ON manual_indexes(title);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- 顯示初始化完成訊息
DO $$
BEGIN
  RAISE NOTICE '✅ Lens Service 資料庫初始化完成！';
  RAISE NOTICE '📊 已創建表格：conversations, manual_indexes, settings, admin_users';
  RAISE NOTICE '👤 預設管理員帳號：lens / 1234';
  RAISE NOTICE '📝 已插入 2 個範例手動索引';
END $$;

