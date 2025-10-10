-- Lens Service Database Schema
-- PostgreSQL 16

-- 對話記錄表
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    conversation_id VARCHAR(255) NOT NULL UNIQUE,
    messages JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_conversation_id ON conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- 手動索引表
CREATE TABLE IF NOT EXISTS manual_indexes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    url TEXT,
    keywords JSONB,
    fingerprint TEXT NOT NULL UNIQUE,
    embedding TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_manual_indexes_fingerprint ON manual_indexes(fingerprint);
CREATE INDEX IF NOT EXISTS idx_manual_indexes_created_at ON manual_indexes(created_at DESC);

-- 更新時間觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為 conversations 表添加觸發器
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 為 manual_indexes 表添加觸發器
DROP TRIGGER IF EXISTS update_manual_indexes_updated_at ON manual_indexes;
CREATE TRIGGER update_manual_indexes_updated_at 
    BEFORE UPDATE ON manual_indexes
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 管理員帳號表
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- IP 白名單表
CREATE TABLE IF NOT EXISTS ip_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(45) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ip_whitelist_ip ON ip_whitelist(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_active ON ip_whitelist(is_active);

-- 為所有新表添加更新時間觸發器
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ip_whitelist_updated_at ON ip_whitelist;
CREATE TRIGGER update_ip_whitelist_updated_at
    BEFORE UPDATE ON ip_whitelist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入測試數據
-- 預設管理員帳號（用戶名：lens，密碼：1234）
-- 密碼使用 bcrypt hash，這裡使用簡單的明文存儲，實際應用應該使用 bcrypt
INSERT INTO admin_users (username, password_hash, email, role) VALUES
    ('lens', '1234', 'lens@lens-service.com', 'super_admin')
ON CONFLICT (username) DO NOTHING;

-- 測試對話已移除（不需要假數據）

-- 測試手動索引
INSERT INTO manual_indexes (name, description, content, keywords, fingerprint) VALUES
    ('產品說明', '產品功能介紹', '我們的產品提供 AI 客服功能...', '["產品","功能","AI"]'::jsonb, 'fp-001')
ON CONFLICT (fingerprint) DO NOTHING;

-- Sitemap配置表
CREATE TABLE IF NOT EXISTS sitemap_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    sitemap_url TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    auto_update BOOLEAN DEFAULT false,
    update_interval INTEGER DEFAULT 60, -- 分鐘
    last_crawled_at TIMESTAMP,
    crawl_status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
    total_pages INTEGER DEFAULT 0,
    indexed_pages INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sitemap頁面內容表
CREATE TABLE IF NOT EXISTS sitemap_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sitemap_config_id UUID REFERENCES sitemap_configs(id) ON DELETE CASCADE,
    url TEXT NOT NULL UNIQUE,
    title TEXT,
    content TEXT,
    meta_description TEXT,
    keywords JSONB,
    embedding TEXT, -- JSON格式存儲向量
    fingerprint VARCHAR(255),
    last_crawled_at TIMESTAMP,
    crawl_status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed
    error_message TEXT,
    user_context JSONB, -- 存儲用戶相關的動態內容
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sitemap爬取日誌表
CREATE TABLE IF NOT EXISTS sitemap_crawl_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sitemap_config_id UUID REFERENCES sitemap_configs(id) ON DELETE CASCADE,
    crawl_type VARCHAR(50) NOT NULL, -- full, incremental, manual
    status VARCHAR(50) NOT NULL, -- running, completed, failed
    total_urls INTEGER DEFAULT 0,
    processed_urls INTEGER DEFAULT 0,
    successful_urls INTEGER DEFAULT 0,
    failed_urls INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_sitemap_configs_domain ON sitemap_configs(domain);
CREATE INDEX IF NOT EXISTS idx_sitemap_configs_enabled ON sitemap_configs(enabled);
CREATE INDEX IF NOT EXISTS idx_sitemap_pages_sitemap_config_id ON sitemap_pages(sitemap_config_id);
CREATE INDEX IF NOT EXISTS idx_sitemap_pages_url ON sitemap_pages(url);
CREATE INDEX IF NOT EXISTS idx_sitemap_pages_fingerprint ON sitemap_pages(fingerprint);
CREATE INDEX IF NOT EXISTS idx_sitemap_crawl_logs_sitemap_config_id ON sitemap_crawl_logs(sitemap_config_id);

-- 為sitemap表添加觸發器
DROP TRIGGER IF EXISTS update_sitemap_configs_updated_at ON sitemap_configs;
CREATE TRIGGER update_sitemap_configs_updated_at
    BEFORE UPDATE ON sitemap_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sitemap_pages_updated_at ON sitemap_pages;
CREATE TRIGGER update_sitemap_pages_updated_at
    BEFORE UPDATE ON sitemap_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 測試sitemap數據
INSERT INTO sitemap_configs (name, domain, sitemap_url, enabled, auto_update) VALUES
    ('主站點', 'example.com', 'https://example.com/sitemap.xml', true, true)
ON CONFLICT DO NOTHING;

-- 顯示表格結構
\dt
\d conversations
\d manual_indexes
\d admin_users
\d ip_whitelist
\d sitemap_configs
\d sitemap_pages
\d sitemap_crawl_logs

