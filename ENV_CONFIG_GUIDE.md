# Lens Service 環境變量配置指南

## 📋 為什麼需要環境變量？

Lens Service 現在是一個 npm 套件，需要在**使用者的專案**中配置環境變量。

### 配置層級

#### 第一層：環境變量（必需）
- 存放在使用者專案的 `.env.local` 文件中
- 服務啟動時讀取
- **不能在運行時修改**

#### 第二層：資料庫配置（可選）
- 存放在資料庫中
- 可以在後台動態管理
- **可以在運行時新增/修改**

## 🔧 必需的環境變量

使用者需要在他們的專案中創建 `.env.local` 文件：

```env
# Azure OpenAI 配置（主要配置）
NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
NEXT_PUBLIC_AZURE_OPENAI_KEY=your-api-key
NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT=gpt-4o-testing
NEXT_PUBLIC_AZURE_OPENAI_API_VERSION=2025-01-01-preview
NEXT_PUBLIC_AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small-3
NEXT_PUBLIC_AZURE_OPENAI_EMBEDDING_API_VERSION=2024-02-01

# 資料庫 API 配置（用於存儲對話記錄等）
NEXT_PUBLIC_DATABASE_API_URL=http://localhost:3001/api
NEXT_PUBLIC_DATABASE_API_KEY=your-database-api-key

# SQL 連接（後端用）
DATABASE_URL=postgresql://lens_user:lens_password@localhost:5432/lens_service
```

## 📝 使用說明

### 1. 初始化套件

```typescript
import LensService from 'lens-service';

LensService.init({
  azureOpenAI: {
    endpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.NEXT_PUBLIC_AZURE_OPENAI_KEY,
    deployment: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT,
    embeddingDeployment: process.env.NEXT_PUBLIC_AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
    apiVersion: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_VERSION,
    embeddingApiVersion: process.env.NEXT_PUBLIC_AZURE_OPENAI_EMBEDDING_API_VERSION
  },
  ui: {
    position: 'right',
    width: '33.33%'
  },
  debug: true
});
```

### 2. 後台管理

#### Agent & API 設定頁面
- **只顯示當前配置**（從環境變量讀取）
- **不允許修改**（因為環境變量在運行時無法修改）
- 顯示提示：「如需修改，請更新 .env.local 文件並重啟服務」

#### API Keys 管理頁面（新增）
- 可以新增**額外的** API Keys
- 用於備用或特殊用途
- 存儲在資料庫中
- Agent 可以根據需求選擇使用

#### 資料庫連接管理頁面（新增）
- 可以新增 Plugin 用的外部資料庫
- 包含 Schema 資訊
- Agent 可以查詢這些資料庫

#### Tool Guides 管理頁面（新增）
- 管理 Tool 使用指南
- 提供範例和最佳實踐
- 幫助 Agent 更好地使用 Tools

## 🔄 工作流程

### 服務啟動
```
1. 讀取 .env.local
   ↓
2. 初始化主要 OpenAI 服務
   ↓
3. 連接資料庫
   ↓
4. 載入額外的配置（API Keys, DB Connections, Tool Guides）
   ↓
5. 初始化 Plugins
```

### 後台管理
```
管理員登入
   ↓
查看當前配置（只讀）
   ↓
管理額外配置（可編輯）
- 額外的 API Keys
- Plugin 資料庫連接
- Tool Guides
- Sitemap 內容
```

## 🔐 安全考量

### 環境變量
- ✅ 不提交到 Git
- ✅ 只在服務器端使用（除了 NEXT_PUBLIC_ 前綴）
- ✅ 敏感資訊加密存儲

### 資料庫配置
- ✅ 需要管理員權限
- ✅ IP 白名單保護
- ✅ API Key 認證
- ✅ 密碼 hash 存儲

## 📚 範例

### 完整的 .env.local 範例

```env
# ============================================
# Azure OpenAI 配置（主要配置）
# ============================================
NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT=https://fluxmind.openai.azure.com/
NEXT_PUBLIC_AZURE_OPENAI_KEY=1NoMXAmlrikqn0GYOWk3dc9ICuLimcmfMwEkHuLgIaIobBJ1W6POJQQJ99ALACi0881XJ3w3AAABACOGhmzS
NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT=gpt-4o-testing
NEXT_PUBLIC_AZURE_OPENAI_API_VERSION=2025-01-01-preview
NEXT_PUBLIC_AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small-3
NEXT_PUBLIC_AZURE_OPENAI_EMBEDDING_API_VERSION=2024-02-01

# ============================================
# 資料庫 API 配置
# ============================================
NEXT_PUBLIC_DATABASE_API_URL=http://localhost:3001/api
NEXT_PUBLIC_DATABASE_API_KEY=your-secure-api-key-here

# ============================================
# SQL 連接（後端用）
# ============================================
DATABASE_URL=postgresql://lens_user:lens_password@localhost:5432/lens_service

# ============================================
# 其他配置（可選）
# ============================================
NEXT_PUBLIC_DEBUG=true
```

### 後台新增額外 API Key 範例

```json
{
  "name": "OpenAI Backup Key",
  "service_type": "openai",
  "api_key": "sk-...",
  "endpoint": "https://api.openai.com/v1",
  "additional_config": {
    "model": "gpt-4",
    "max_tokens": 2000,
    "temperature": 0.7
  },
  "is_active": true
}
```

### 後台新增資料庫連接範例

```json
{
  "name": "客戶資料庫",
  "description": "存儲客戶基本資料和訂單記錄",
  "db_type": "postgresql",
  "connection_string": "postgresql://user:pass@host:5432/customers",
  "proxy_url": "https://api.example.com/sql-proxy",
  "schema_info": {
    "tables": [
      {
        "name": "customers",
        "description": "客戶基本資料",
        "columns": [
          {
            "name": "id",
            "type": "uuid",
            "description": "客戶 ID",
            "searchable": false
          },
          {
            "name": "name",
            "type": "varchar",
            "description": "客戶姓名",
            "searchable": true
          },
          {
            "name": "email",
            "type": "varchar",
            "description": "電子郵件",
            "searchable": true
          }
        ]
      }
    ]
  },
  "is_active": true
}
```

## 🎯 總結

### 主要配置（環境變量）
- ✅ 服務啟動必需
- ✅ 存放在 `.env.local`
- ❌ 不能在運行時修改
- ❌ 不提交到 Git

### 額外配置（資料庫）
- ✅ 可選功能
- ✅ 存放在資料庫
- ✅ 可以在後台管理
- ✅ 可以動態新增/修改

這樣的設計既保證了安全性，又提供了靈活性！

