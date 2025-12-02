-- ============================================
-- Lens Service V3 - Schema V2 Updates
-- 新增: Session Memory, Telegram Config, Agent Plans, Web Use Logs, Admin Users
-- ============================================

-- 執行此檔案前，請先確保已執行 schema.sql

-- ============================================
-- Session Memory Table (取代 Redis)
-- ============================================

CREATE TABLE IF NOT EXISTS session_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),                    -- 來自 widget 的外部用戶 ID
    messages JSONB NOT NULL DEFAULT '[]',     -- 對話歷史
    context JSONB DEFAULT '{}',               -- 上下文資訊
    active_plan JSONB DEFAULT NULL,           -- 當前進行中的計劃
    metadata JSONB DEFAULT '{}',
    is_temp BOOLEAN DEFAULT false,            -- 是否為暫存 session (後台測試用)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,      -- 過期時間
    UNIQUE(tenant_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_session_memory_tenant ON session_memory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_session_memory_user ON session_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_session_memory_session ON session_memory(session_id);
CREATE INDEX IF NOT EXISTS idx_session_memory_expires ON session_memory(expires_at);

-- 自動更新 updated_at
CREATE TRIGGER update_session_memory_updated_at
    BEFORE UPDATE ON session_memory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Telegram 配置 Table
-- ============================================

CREATE TABLE IF NOT EXISTS telegram_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,               -- 顯示名稱 (如: 客服小明)
    bot_token TEXT NOT NULL,                  -- Bot Token
    chat_id VARCHAR(100) NOT NULL,            -- Chat ID
    description TEXT,                         -- 描述
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_telegram_configs_tenant ON telegram_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_telegram_configs_active ON telegram_configs(tenant_id, is_active);

CREATE TRIGGER update_telegram_configs_updated_at
    BEFORE UPDATE ON telegram_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Agent 執行計劃 Table
-- ============================================

CREATE TABLE IF NOT EXISTS agent_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    query TEXT NOT NULL,                      -- 原始查詢
    plan_summary TEXT,                        -- 計劃摘要
    plan_steps JSONB NOT NULL,                -- 計劃步驟
    status VARCHAR(50) DEFAULT 'pending',     -- pending, approved, executing, completed, cancelled, failed
    approval_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    execution_log JSONB DEFAULT '[]',         -- 執行日誌
    result JSONB,                             -- 執行結果
    error_message TEXT,                       -- 錯誤訊息
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_plans_tenant ON agent_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_plans_session ON agent_plans(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_plans_status ON agent_plans(status);
CREATE INDEX IF NOT EXISTS idx_agent_plans_user ON agent_plans(user_id);

CREATE TRIGGER update_agent_plans_updated_at
    BEFORE UPDATE ON agent_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Web Use 操作日誌 Table
-- ============================================

CREATE TABLE IF NOT EXISTS web_use_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    plan_id UUID REFERENCES agent_plans(id) ON DELETE CASCADE,
    step_number INTEGER,                      -- 計劃中的步驟編號
    action_type VARCHAR(50) NOT NULL,         -- click, fill, select, navigate, scroll, etc.
    target_selector TEXT,                     -- CSS 選擇器
    target_xpath TEXT,                        -- XPath
    target_element_id VARCHAR(100),           -- 元素 ID
    action_params JSONB,                      -- 操作參數
    result JSONB,                             -- 執行結果
    screenshot_before TEXT,                   -- Base64 截圖 (執行前)
    screenshot_after TEXT,                    -- Base64 截圖 (執行後)
    dom_state_before JSONB,                   -- DOM 狀態 (執行前) - 精簡版
    dom_state_after JSONB,                    -- DOM 狀態 (執行後) - 精簡版
    page_url TEXT,                            -- 當時的頁面 URL
    success BOOLEAN,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_use_logs_tenant ON web_use_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_web_use_logs_session ON web_use_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_web_use_logs_plan ON web_use_logs(plan_id);
CREATE INDEX IF NOT EXISTS idx_web_use_logs_created ON web_use_logs(created_at DESC);

-- ============================================
-- 管理員用戶 Table
-- ============================================

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',         -- admin, super_admin
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, username)
);

CREATE INDEX IF NOT EXISTS idx_admin_users_tenant ON admin_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 更新 knowledge_documents 支援多種類型
-- ============================================

ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS doc_type VARCHAR(50) DEFAULT 'qa';
-- doc_type: 'qa' (客服QA), 'activity' (活動), 'policy' (政策), 'manual' (手冊), 'faq' (常見問題)

CREATE INDEX IF NOT EXISTS idx_knowledge_doc_type ON knowledge_documents(doc_type);

-- ============================================
-- Widget 配置 Table (用於存儲 widget 的設定)
-- ============================================

CREATE TABLE IF NOT EXISTS widget_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'default',
    title VARCHAR(255) DEFAULT 'AI 智能客服',
    subtitle TEXT,
    welcome_message TEXT DEFAULT '您好！我是 AI 智能客服，有什麼可以幫助您的嗎？',
    primary_color VARCHAR(20) DEFAULT '#007bff',
    position VARCHAR(20) DEFAULT 'bottom-right',   -- bottom-right, bottom-left
    theme VARCHAR(20) DEFAULT 'light',              -- light, dark
    enable_plan_approval BOOLEAN DEFAULT true,      -- 是否啟用計劃確認
    enable_contact_feature BOOLEAN DEFAULT true,    -- 是否啟用聯繫功能
    allowed_domains TEXT[],                         -- 允許嵌入的網域
    custom_css TEXT,                                -- 自定義 CSS
    custom_js TEXT,                                 -- 自定義 JS
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_widget_configs_tenant ON widget_configs(tenant_id);

CREATE TRIGGER update_widget_configs_updated_at
    BEFORE UPDATE ON widget_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 初始化默認資料
-- ============================================

-- 插入默認管理員 (密碼: 1234, 使用 bcrypt hash)
-- 注意: 這是開發用的默認值，生產環境請更改
INSERT INTO admin_users (tenant_id, username, password_hash, role)
SELECT
    '00000000-0000-0000-0000-000000000001',
    'lens',
    '$2b$10$rQZ8K8HJ8X8X8X8X8X8X8uX8X8X8X8X8X8X8X8X8X8X8X8X8X8X8', -- placeholder, 需要在應用中處理
    'super_admin'
WHERE NOT EXISTS (
    SELECT 1 FROM admin_users WHERE username = 'lens' AND tenant_id = '00000000-0000-0000-0000-000000000001'
);

-- 插入默認 Widget 配置
INSERT INTO widget_configs (tenant_id, name, title)
SELECT
    '00000000-0000-0000-0000-000000000001',
    'default',
    'Lens AI 智能客服'
WHERE NOT EXISTS (
    SELECT 1 FROM widget_configs WHERE tenant_id = '00000000-0000-0000-0000-000000000001' AND name = 'default'
);

-- ============================================
-- 清理過期 Session 的函數
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM session_memory
    WHERE expires_at IS NOT NULL AND expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 註解說明
-- ============================================

COMMENT ON TABLE session_memory IS 'Session memory storage (取代 Redis)，支援持久化對話歷史';
COMMENT ON TABLE telegram_configs IS 'Telegram bot 配置，支援多帳號訊息傳送';
COMMENT ON TABLE agent_plans IS 'Agent 執行計劃，需要用戶確認後才執行';
COMMENT ON TABLE web_use_logs IS 'Web 自動化操作日誌，記錄所有 DOM 操作';
COMMENT ON TABLE admin_users IS '後台管理員用戶';
COMMENT ON TABLE widget_configs IS 'Widget 嵌入配置';

COMMENT ON COLUMN session_memory.is_temp IS '暫存 session，用於後台測試，會自動過期';
COMMENT ON COLUMN session_memory.active_plan IS '當前正在執行或等待確認的計劃';
COMMENT ON COLUMN agent_plans.status IS 'pending=等待確認, approved=已確認, executing=執行中, completed=完成, cancelled=取消, failed=失敗';
COMMENT ON COLUMN web_use_logs.dom_state_before IS '只存儲關鍵元素的精簡 DOM 狀態，避免過大';
