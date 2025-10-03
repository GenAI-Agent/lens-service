# Lens Service

可嵌入任何網站的 AI 客服 Widget，基於 Azure OpenAI。

## 📦 安裝

```bash
# npm
npm install git+https://github.com/GenAI-Agent/lens-service.git

# yarn
yarn add git+https://github.com/GenAI-Agent/lens-service.git

# 安裝對等依賴
npm install openai
# 或
yarn add openai
```

## 特點

- ✅ **純前端實現** - 不需要額外的後端服務器
- ✅ **LangGraph Agent** - 內建簡化版 Supervisor Agent
- ✅ **全站搜尋** - 自動索引網站內容並提供智能搜尋
- ✅ **對話記憶** - 自動保存對話歷史到瀏覽器
- ✅ **自定義規則** - 靈活配置不同場景的對話規則
- ✅ **易於整合** - 只需幾行代碼即可整合
- ✅ **響應式設計** - 側邊欄從右側滑入，推動原頁面

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 開發

```bash
npm run dev
```

訪問 http://localhost:5173/demo.html 查看演示。

### 3. 構建

```bash
npm run build
```

構建後的文件在 `dist/` 目錄。

## 使用方式

### 基本使用

```html
<!-- 引入 Widget -->
<script src="node_modules/lens-service/dist/lens-service.umd.js"></script>

<script>
  // 初始化
  LensService.init({
    azureOpenAI: {
      endpoint: 'https://your-resource.openai.azure.com/',
      apiKey: 'your-api-key',
      deployment: 'gpt-4'
    }
  });

  // 綁定到按鈕
  document.getElementById('help-button').addEventListener('click', () => {
    LensService.open();
  });
</script>
```

### 完整配置

```javascript
LensService.init({
  // Azure OpenAI 配置（必需）
  azureOpenAI: {
    endpoint: 'https://your-resource.openai.azure.com/',
    apiKey: 'your-api-key',
    deployment: 'gpt-4',
    embeddingDeployment: 'text-embedding-3-small',
    apiVersion: '2024-02-15-preview'
  },
  
  // 網站配置（可選）
  siteConfig: {
    domains: ['example.com', 'sub.example.com'],  // 要爬取的域名
    excludeDomains: ['admin.example.com'],        // 排除的域名
    includePaths: ['/docs', '/help'],             // 包含的路徑
    excludePaths: ['/api', '/admin']              // 排除的路徑
  },
  
  // UI 配置（可選）
  ui: {
    position: 'right',      // 'left' 或 'right'
    width: '33.33%',        // 側邊欄寬度
    primaryColor: '#6366f1',
    language: 'zh-TW'
  },
  
  // 功能配置（可選）
  features: {
    enableScreenshot: true,
    enableRules: true,
    enableSearch: true
  },
  
  // 規則配置（可選）
  rules: [
    {
      id: 'default',
      name: '客服助手',
      description: '專業的客服助手',
      systemPrompt: '你是一個專業的客服助手...',
      temperature: 0.7,
      maxTokens: 1000,
      isActive: true
    }
  ],
  
  // 調試模式（可選）
  debug: true
});
```

## API

### LensService.init(config)

初始化 Widget。

### LensService.open()

打開側邊欄面板。

### LensService.close()

關閉側邊欄面板。

### LensService.sendMessage(message)

發送訊息。

### LensService.setRule(ruleId)

切換規則。

### LensService.indexSite(startUrl, onProgress?)

索引網站內容。

```javascript
await LensService.indexSite(
  'https://example.com',
  (current, total) => {
    console.log(`進度: ${current}/${total}`);
  }
);
```

### LensService.clearConversation()

清除對話歷史。

### LensService.openAdmin()

打開管理後台。

### LensService.destroy()

銷毀 Widget。

## 多網域支援

可以配置爬取多個子域名：

```javascript
LensService.init({
  // ...
  siteConfig: {
    // 爬取整個主域名
    domains: ['ask-lens.ai'],

    // 或只爬取特定子域名
    domains: ['quant.ask-lens.ai', 'audio.ask-lens.ai'],

    // 排除某些子域名
    excludeDomains: ['admin.ask-lens.ai', 'internal.ask-lens.ai']
  }
});
```

## 架構

```
widget/
├── src/
│   ├── index.ts                 # 主入口
│   ├── types.ts                 # 類型定義
│   ├── agents/
│   │   └── SupervisorAgent.ts   # Supervisor Agent
│   ├── services/
│   │   ├── OpenAIService.ts     # Azure OpenAI 服務
│   │   ├── StorageService.ts    # 本地存儲
│   │   └── IndexingService.ts   # 內容索引
│   └── components/
│       ├── SidePanel.ts         # 側邊欄面板
│       └── styles.ts            # 樣式
├── dist/                        # 構建輸出
├── demo.html                    # 演示頁面
└── package.json
```

## 工作原理

1. **初始化** - 載入配置，初始化 OpenAI 服務和 Agent
2. **索引** - 爬取網站內容，生成 embeddings，存儲到本地
3. **對話** - 用戶提問 → Agent 判斷是否需要搜尋 → 搜尋相關內容 → 生成回答
4. **記憶** - 對話歷史保存到 sessionStorage

## 注意事項

1. **API Key 安全** - 當前 API Key 直接暴露在前端，僅適合演示。生產環境建議使用後端代理。
2. **CORS** - 爬取其他網站可能遇到 CORS 問題，建議只爬取同域名網站。
3. **存儲限制** - 使用 localStorage/sessionStorage，有容量限制（通常 5-10MB）。
4. **性能** - 索引大型網站可能需要較長時間，建議分批處理。

## 資料庫管理

Lens Service 支援將對話記錄和索引存儲到資料庫。請參考 `sql-test` 目錄中的範例。

### 初始化資料庫

```bash
cd sql-test
./init-db.sh
```

這將創建所需的表格：
- `conversations` - 對話記錄
- `manual_indexes` - 手動索引

## 授權

MIT License

