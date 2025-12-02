-- Lens Service V3 Database Schema
-- PostgreSQL with pgvector extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================
-- Core Tables
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255) UNIQUE,
    email VARCHAR(255),
    name VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_external_id ON users(external_id);
CREATE INDEX idx_users_email ON users(email);

-- Tenants table (for multi-tenant support)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    config JSONB DEFAULT '{}',
    api_key VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tenants_api_key ON tenants(api_key);
CREATE INDEX idx_tenants_domain ON tenants(domain);

-- ============================================
-- Knowledge Base Tables
-- ============================================

-- Knowledge base documents
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    content_vector vector(1536),  -- OpenAI ada-002 dimension
    usage_vector vector(1536),     -- Co-retrieval usage vector
    category VARCHAR(100),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_knowledge_tenant ON knowledge_documents(tenant_id);
CREATE INDEX idx_knowledge_category ON knowledge_documents(category);
CREATE INDEX idx_knowledge_content_vector ON knowledge_documents USING ivfflat (content_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_usage_vector ON knowledge_documents USING ivfflat (usage_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_tags ON knowledge_documents USING gin(tags);

-- Full-text search index for BM25-style search
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS content_tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('chinese', title || ' ' || content)) STORED;
CREATE INDEX idx_knowledge_content_fts ON knowledge_documents USING gin(content_tsv);

-- ============================================
-- Product Tables
-- ============================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    external_id VARCHAR(255),
    name VARCHAR(500) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2),
    original_price DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'TWD',
    category VARCHAR(100),
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    tags TEXT[],
    images TEXT[],
    url VARCHAR(1000),
    stock_status VARCHAR(50) DEFAULT 'in_stock',
    attributes JSONB DEFAULT '{}',
    content_vector vector(1536),
    usage_vector vector(1536),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_external_id ON products(tenant_id, external_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_content_vector ON products USING ivfflat (content_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_products_usage_vector ON products USING ivfflat (usage_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_products_tags ON products USING gin(tags);

-- Full-text search for products
ALTER TABLE products ADD COLUMN IF NOT EXISTS content_tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('chinese', name || ' ' || COALESCE(description, ''))) STORED;
CREATE INDEX idx_products_fts ON products USING gin(content_tsv);

-- ============================================
-- Conversation Tables
-- ============================================

-- Conversation sessions
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    external_user_id VARCHAR(255),
    channel VARCHAR(50) DEFAULT 'widget',
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_sessions_tenant ON conversation_sessions(tenant_id);
CREATE INDEX idx_sessions_user ON conversation_sessions(user_id);
CREATE INDEX idx_sessions_started ON conversation_sessions(started_at DESC);

-- Conversation messages
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    tokens_used INTEGER,
    latency_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_session ON conversation_messages(session_id);
CREATE INDEX idx_messages_created ON conversation_messages(created_at DESC);

-- ============================================
-- Agent & Skill Tables
-- ============================================

-- Skills configuration
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    trigger_pattern VARCHAR(255) NOT NULL,
    persona TEXT,
    allowed_agents TEXT[],
    allowed_tools TEXT[],
    pre_actions JSONB DEFAULT '[]',
    post_actions JSONB DEFAULT '[]',
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_skills_tenant ON skills(tenant_id);
CREATE INDEX idx_skills_name ON skills(name);

-- Agent execution logs
CREATE TABLE IF NOT EXISTS agent_execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL,
    input_summary TEXT,
    output_summary TEXT,
    tools_called TEXT[],
    execution_time_ms INTEGER,
    tokens_used INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agent_logs_session ON agent_execution_logs(session_id);
CREATE INDEX idx_agent_logs_type ON agent_execution_logs(agent_type);
CREATE INDEX idx_agent_logs_created ON agent_execution_logs(created_at DESC);

-- ============================================
-- Co-Retrieval Learning Tables
-- ============================================

-- Co-retrieval affinity matrix (sparse storage)
CREATE TABLE IF NOT EXISTS co_retrieval_matrix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL, -- 'knowledge' or 'product'
    doc_id_i UUID NOT NULL,
    doc_id_j UUID NOT NULL,
    affinity_score FLOAT DEFAULT 0,
    co_occurrence_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, doc_type, doc_id_i, doc_id_j)
);

CREATE INDEX idx_co_retrieval_tenant ON co_retrieval_matrix(tenant_id);
CREATE INDEX idx_co_retrieval_doc_i ON co_retrieval_matrix(doc_id_i);
CREATE INDEX idx_co_retrieval_doc_j ON co_retrieval_matrix(doc_id_j);

-- Co-retrieval feedback events
CREATE TABLE IF NOT EXISTS co_retrieval_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    doc_type VARCHAR(50) NOT NULL,
    query_text TEXT,
    query_vector vector(1536),
    retrieved_doc_ids UUID[],
    selected_doc_ids UUID[],
    feedback_type VARCHAR(50) NOT NULL, -- 'agent_selection', 'user_click', 'purchase', 'add_to_cart'
    feedback_weight FLOAT DEFAULT 1.0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_tenant ON co_retrieval_feedback(tenant_id);
CREATE INDEX idx_feedback_type ON co_retrieval_feedback(feedback_type);
CREATE INDEX idx_feedback_created ON co_retrieval_feedback(created_at DESC);

-- ============================================
-- Generated Pages Tables
-- ============================================

-- AI-generated pages
CREATE TABLE IF NOT EXISTS ai_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    slug VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    page_type VARCHAR(50) NOT NULL, -- 'product', 'comparison', 'collection', 'content'
    theme VARCHAR(50) DEFAULT 'default',
    blocks JSONB NOT NULL DEFAULT '[]',
    html_content TEXT,
    metadata JSONB DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_pages_tenant ON ai_pages(tenant_id);
CREATE INDEX idx_pages_slug ON ai_pages(tenant_id, slug);
CREATE INDEX idx_pages_session ON ai_pages(session_id);
CREATE INDEX idx_pages_type ON ai_pages(page_type);
CREATE INDEX idx_pages_created ON ai_pages(created_at DESC);

-- Page view analytics
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES ai_pages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID,
    referrer VARCHAR(1000),
    user_agent TEXT,
    ip_address INET,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_page_views_page ON page_views(page_id);
CREATE INDEX idx_page_views_date ON page_views(viewed_at DESC);

-- ============================================
-- User Interaction Tables
-- ============================================

-- User interactions for analytics and personalization
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE SET NULL,
    interaction_type VARCHAR(50) NOT NULL, -- 'view', 'click', 'add_to_cart', 'purchase', 'search', 'chat'
    entity_type VARCHAR(50), -- 'product', 'page', 'knowledge'
    entity_id UUID,
    query_text TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_interactions_tenant ON user_interactions(tenant_id);
CREATE INDEX idx_interactions_user ON user_interactions(user_id);
CREATE INDEX idx_interactions_type ON user_interactions(interaction_type);
CREATE INDEX idx_interactions_entity ON user_interactions(entity_type, entity_id);
CREATE INDEX idx_interactions_created ON user_interactions(created_at DESC);

-- ============================================
-- Order Tables (for OrderAgent)
-- ============================================

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    external_order_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'TWD',
    shipping_address JSONB,
    billing_address JSONB,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    shipping_method VARCHAR(100),
    shipping_status VARCHAR(50) DEFAULT 'pending',
    tracking_number VARCHAR(255),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_external ON orders(tenant_id, external_order_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    external_product_id VARCHAR(255),
    product_name VARCHAR(500) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================
-- Notification Tables
-- ============================================

-- Notification logs
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE SET NULL,
    channel VARCHAR(50) NOT NULL, -- 'telegram', 'email', 'sms', 'webhook'
    recipient VARCHAR(255),
    subject VARCHAR(500),
    content TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_tenant ON notification_logs(tenant_id);
CREATE INDEX idx_notifications_status ON notification_logs(status);
CREATE INDEX idx_notifications_created ON notification_logs(created_at DESC);

-- ============================================
-- Schema Registry (for dynamic SQL tools)
-- ============================================

-- Registered table schemas
CREATE TABLE IF NOT EXISTS schema_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    columns JSONB NOT NULL, -- Array of {name, type, description, isSearchable, isFilterable}
    allowed_operations TEXT[] DEFAULT ARRAY['select'],
    user_id_column VARCHAR(100), -- Column used for user isolation
    requires_user_filter BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, table_name)
);

CREATE INDEX idx_schema_tenant ON schema_registry(tenant_id);

-- ============================================
-- API Key Management
-- ============================================

-- API keys for LLM services (with rotation support)
CREATE TABLE IF NOT EXISTS llm_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'azure_openai', 'openai', 'anthropic'
    key_name VARCHAR(100),
    api_key_encrypted TEXT NOT NULL,
    endpoint VARCHAR(500),
    deployment_name VARCHAR(100),
    model VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    rate_limit_rpm INTEGER,
    rate_limit_tpm INTEGER,
    failure_count INTEGER DEFAULT 0,
    last_failure_at TIMESTAMP WITH TIME ZONE,
    cooldown_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_keys_tenant ON llm_api_keys(tenant_id);
CREATE INDEX idx_api_keys_provider ON llm_api_keys(provider);

-- ============================================
-- Audit & System Tables
-- ============================================

-- System audit log
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_updated_at BEFORE UPDATE ON knowledge_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON ai_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schema_updated_at BEFORE UPDATE ON schema_registry FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON llm_api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for hybrid search combining BM25 and vector similarity
CREATE OR REPLACE FUNCTION hybrid_search(
    p_table_name TEXT,
    p_query_text TEXT,
    p_query_vector vector(1536),
    p_usage_vector vector(1536) DEFAULT NULL,
    p_tenant_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_bm25_weight FLOAT DEFAULT 0.3,
    p_content_weight FLOAT DEFAULT 0.4,
    p_usage_weight FLOAT DEFAULT 0.3
)
RETURNS TABLE (
    id UUID,
    score FLOAT,
    bm25_score FLOAT,
    content_similarity FLOAT,
    usage_similarity FLOAT
) AS $$
DECLARE
    query_tsquery tsquery;
BEGIN
    query_tsquery := plainto_tsquery('chinese', p_query_text);

    RETURN QUERY EXECUTE format(
        'WITH bm25_results AS (
            SELECT
                d.id,
                ts_rank_cd(d.content_tsv, $1) as bm25_score
            FROM %I d
            WHERE ($2 IS NULL OR d.tenant_id = $2)
              AND d.is_active = true
              AND d.content_tsv @@ $1
            ORDER BY bm25_score DESC
            LIMIT $3 * 3
        ),
        content_vector_results AS (
            SELECT
                d.id,
                1 - (d.content_vector <=> $4) as content_similarity
            FROM %I d
            WHERE ($2 IS NULL OR d.tenant_id = $2)
              AND d.is_active = true
              AND d.content_vector IS NOT NULL
            ORDER BY d.content_vector <=> $4
            LIMIT $3 * 3
        ),
        usage_vector_results AS (
            SELECT
                d.id,
                CASE
                    WHEN $5 IS NOT NULL AND d.usage_vector IS NOT NULL
                    THEN 1 - (d.usage_vector <=> $5)
                    ELSE 0
                END as usage_similarity
            FROM %I d
            WHERE ($2 IS NULL OR d.tenant_id = $2)
              AND d.is_active = true
              AND d.usage_vector IS NOT NULL
              AND $5 IS NOT NULL
            ORDER BY d.usage_vector <=> $5
            LIMIT $3 * 3
        ),
        combined AS (
            SELECT DISTINCT
                COALESCE(b.id, cv.id, uv.id) as id,
                COALESCE(b.bm25_score, 0) as bm25_score,
                COALESCE(cv.content_similarity, 0) as content_similarity,
                COALESCE(uv.usage_similarity, 0) as usage_similarity
            FROM bm25_results b
            FULL OUTER JOIN content_vector_results cv ON b.id = cv.id
            FULL OUTER JOIN usage_vector_results uv ON COALESCE(b.id, cv.id) = uv.id
        )
        SELECT
            c.id,
            (c.bm25_score * $6 + c.content_similarity * $7 + c.usage_similarity * $8) as score,
            c.bm25_score,
            c.content_similarity,
            c.usage_similarity
        FROM combined c
        ORDER BY score DESC
        LIMIT $3',
        p_table_name, p_table_name, p_table_name
    )
    USING query_tsquery, p_tenant_id, p_limit, p_query_vector, p_usage_vector,
          p_bm25_weight, p_content_weight, p_usage_weight;
END;
$$ LANGUAGE plpgsql;

-- Function for RRF (Reciprocal Rank Fusion)
CREATE OR REPLACE FUNCTION rrf_fusion(
    p_ranks INTEGER[],
    p_k INTEGER DEFAULT 60
)
RETURNS FLOAT AS $$
DECLARE
    total_score FLOAT := 0;
    rank_val INTEGER;
BEGIN
    FOREACH rank_val IN ARRAY p_ranks
    LOOP
        IF rank_val > 0 THEN
            total_score := total_score + (1.0 / (p_k + rank_val));
        END IF;
    END LOOP;
    RETURN total_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Sample Data Insert (for development)
-- ============================================

-- Insert a default tenant for development
INSERT INTO tenants (id, name, domain, api_key, config)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Development Tenant',
    'localhost',
    'dev_api_key_12345',
    '{"features": ["chat", "pages", "recommendations"]}'
) ON CONFLICT DO NOTHING;

-- Insert default schema registry entries
INSERT INTO schema_registry (tenant_id, table_name, display_name, description, columns, allowed_operations, user_id_column, requires_user_filter)
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'orders',
    '訂單',
    '用戶訂單記錄',
    '[
        {"name": "id", "type": "uuid", "description": "訂單ID"},
        {"name": "external_order_id", "type": "varchar", "description": "外部訂單編號", "isSearchable": true},
        {"name": "status", "type": "varchar", "description": "訂單狀態", "isFilterable": true},
        {"name": "total_amount", "type": "decimal", "description": "訂單總金額"},
        {"name": "shipping_status", "type": "varchar", "description": "配送狀態", "isFilterable": true},
        {"name": "tracking_number", "type": "varchar", "description": "物流追蹤號碼", "isSearchable": true},
        {"name": "created_at", "type": "timestamp", "description": "建立時間", "isFilterable": true}
    ]'::jsonb,
    ARRAY['select'],
    'user_id',
    true
),
(
    '00000000-0000-0000-0000-000000000001',
    'products',
    '商品',
    '商品目錄',
    '[
        {"name": "id", "type": "uuid", "description": "商品ID"},
        {"name": "name", "type": "varchar", "description": "商品名稱", "isSearchable": true},
        {"name": "description", "type": "text", "description": "商品描述", "isSearchable": true},
        {"name": "price", "type": "decimal", "description": "價格", "isFilterable": true},
        {"name": "category", "type": "varchar", "description": "分類", "isFilterable": true},
        {"name": "brand", "type": "varchar", "description": "品牌", "isFilterable": true},
        {"name": "stock_status", "type": "varchar", "description": "庫存狀態", "isFilterable": true}
    ]'::jsonb,
    ARRAY['select'],
    NULL,
    false
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE knowledge_documents IS 'Knowledge base documents for customer service RAG';
COMMENT ON TABLE products IS 'Product catalog with vector embeddings for recommendations';
COMMENT ON TABLE co_retrieval_matrix IS 'Sparse co-retrieval affinity matrix for learning document relationships';
COMMENT ON TABLE co_retrieval_feedback IS 'Feedback events for updating co-retrieval learning';
COMMENT ON TABLE ai_pages IS 'AI-generated pages with composable blocks';
COMMENT ON TABLE skills IS 'Skill configurations with pre/post actions';
COMMENT ON TABLE schema_registry IS 'Dynamic schema registry for SQL tool generation with user isolation';
