# Lens Service Widget 串接指南

## 📋 目錄
1. [快速開始](#快速開始)
2. [完整配置](#完整配置)
3. [用戶身份傳遞](#用戶身份傳遞)
4. [API 端點](#api-端點)
5. [樣式自定義](#樣式自定義)
6. [進階功能](#進階功能)
7. [故障排除](#故障排除)

---

## 🚀 快速開始

### 步驟 1: 引入 Widget 腳本

在你的 HTML 頁面中引入 widget：

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <!-- 你的網站內容 -->
  
  <!-- 引入 Lens Service Widget -->
  <script src="http://localhost:3000/lens-service.umd.js"></script>
  
  <script>
    // 初始化 widget
    window.addEventListener('DOMContentLoaded', async () => {
      await window.LensService.init({
        // 基本配置
        ui: {
          width: '400px',
          position: 'right',
        },
        debug: true,
      });
    });
  </script>
</body>
</html>
```

### 步驟 2: 測試

打開頁面，你應該會看到右下角出現客服圖標。點擊即可打開客服面板。

---

## ⚙️ 完整配置

### 配置選項說明

```typescript
interface LensServiceConfig {
  // Azure OpenAI 配置（用於 AI 回覆和 Embedding）
  azureOpenAI?: {
    endpoint: string;           // Azure OpenAI 端點
    apiKey: string;             // API Key
    deployment: string;         // Chat 模型部署名稱
    embeddingDeployment: string; // Embedding 模型部署名稱
  };
  
  // 資料庫配置（已棄用，現在使用 API）
  database?: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  
  // Telegram 通知配置（可選）
  telegram?: {
    botToken: string;
    chatId: string;
  };
  
  // UI 配置
  ui: {
    width?: string;              // 面板寬度，默認 '400px'
    position?: 'left' | 'right'; // 面板位置，默認 'right'
    iconPosition?: boolean;      // 是否顯示圖標，默認 true
  };
  
  // 用戶 ID（重要！）
  userId?: string;               // 當前登入用戶的 ID
  
  // 調試模式
  debug?: boolean;               // 是否開啟調試日誌
}
```

### 完整配置範例

```javascript
await window.LensService.init({
  azureOpenAI: {
    endpoint: 'https://your-resource.openai.azure.com/',
    apiKey: 'your-api-key',
    deployment: 'gpt-4',
    embeddingDeployment: 'text-embedding-3-small',
  },
  telegram: {
    botToken: 'your-bot-token',
    chatId: 'your-chat-id',
  },
  ui: {
    width: '450px',
    position: 'right',
    iconPosition: true,
  },
  userId: 'user-123', // 從你的登入系統獲取
  debug: false,
});
```

---

## 👤 用戶身份傳遞

### 為什麼需要傳遞 userId？

Widget 需要知道當前用戶是誰，才能：
- 保存對話記錄到正確的用戶
- 載入用戶的歷史對話
- 分離不同用戶的對話記錄

### React 範例（使用 AuthContext）

```typescript
// src/components/LensServiceWidget.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const LensServiceWidget = () => {
  const { user } = useAuth(); // 從你的 Auth Context 獲取用戶
  
  useEffect(() => {
    const initWidget = async () => {
      if (typeof window !== 'undefined' && window.LensService) {
        await window.LensService.init({
          ui: {
            width: '400px',
            position: 'right',
          },
          userId: user?.id, // 傳遞用戶 ID
          debug: true,
        });
      }
    };
    
    initWidget();
  }, [user]); // 當用戶改變時重新初始化
  
  return null;
};

export default LensServiceWidget;
```

### Next.js App Router 範例

```typescript
// src/app/layout.tsx
import LensServiceWidget from '@/components/LensServiceWidget';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
          <LensServiceWidget />
        </AuthProvider>
        
        {/* 引入 widget 腳本 */}
        <Script src="/lens-service.umd.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
```

### 純 JavaScript 範例

```html
<script>
  // 假設你有一個全局的用戶對象
  const currentUser = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com'
  };
  
  window.addEventListener('DOMContentLoaded', async () => {
    await window.LensService.init({
      ui: {
        width: '400px',
        position: 'right',
      },
      userId: currentUser.id, // 傳遞用戶 ID
      debug: true,
    });
  });
</script>
```

---

## 🔌 API 端點

Widget 會調用以下 API 端點（需要在你的後端實現）：

### 對話相關

```
GET  /api/widget/conversations              - 獲取所有對話
POST /api/widget/conversations              - 保存對話
GET  /api/widget/conversations/:id          - 獲取單個對話
DELETE /api/widget/conversations/:id        - 刪除對話
GET  /api/widget/conversations/user/:userId - 獲取用戶的所有對話
```

### 設置相關

```
GET /api/widget/settings           - 獲取所有設置
GET /api/widget/settings/:key      - 獲取單個設置
PUT /api/widget/settings/:key      - 更新設置
```

常用設置 key：
- `system_prompt` - 系統提示詞
- `default_reply` - 默認回覆
- `llms_txt_url` - LLMs.txt URL

### 管理員相關

```
GET  /api/widget/admin-users       - 獲取所有管理員
POST /api/widget/admin-users       - 創建管理員
POST /api/widget/admin-users/login - 管理員登入
DELETE /api/widget/admin-users/:id - 刪除管理員
```

### 手動索引相關

```
GET    /api/widget/manual-indexes     - 獲取所有手動索引
POST   /api/widget/manual-indexes     - 創建手動索引
GET    /api/widget/manual-indexes/:id - 獲取單個索引
PUT    /api/widget/manual-indexes/:id - 更新索引
DELETE /api/widget/manual-indexes/:id - 刪除索引
```

---

## 🎨 樣式自定義

### 修改面板寬度

```javascript
await window.LensService.init({
  ui: {
    width: '500px', // 改為 500px
  },
});
```

### 修改面板位置

```javascript
await window.LensService.init({
  ui: {
    position: 'left', // 改為左側
  },
});
```

### 隱藏浮動圖標

```javascript
await window.LensService.init({
  ui: {
    iconPosition: false, // 隱藏圖標
  },
});

// 手動打開面板
window.LensService.panel.open();
```

### 自定義 CSS

Widget 使用以下 CSS 類名，你可以覆蓋樣式：

```css
/* 浮動圖標 */
#lens-service-floating-icon {
  /* 你的樣式 */
}

/* 側邊面板 */
#lens-service-side-panel {
  /* 你的樣式 */
}

/* 消息容器 */
.sm-messages-container {
  /* 你的樣式 */
}

/* 輸入框 */
#sm-input {
  /* 你的樣式 */
}
```

---

## 🔧 進階功能

### 手動控制面板

```javascript
// 打開面板
window.LensService.panel.open();

// 關閉面板
window.LensService.panel.close();

// 切換面板
window.LensService.panel.toggle();
```

### 監聽事件

```javascript
// 監聽消息發送
window.addEventListener('lens-service:message-sent', (event) => {
  console.log('Message sent:', event.detail);
});

// 監聽面板打開
window.addEventListener('lens-service:panel-opened', () => {
  console.log('Panel opened');
});

// 監聽面板關閉
window.addEventListener('lens-service:panel-closed', () => {
  console.log('Panel closed');
});
```

### 程式化發送消息

```javascript
// 發送消息
await window.LensService.sendMessage('你好，我需要幫助');
```

---

## 🐛 故障排除

### 問題 1: Widget 沒有顯示

**檢查清單：**
1. 確認腳本已正確引入
2. 檢查瀏覽器控制台是否有錯誤
3. 確認 `window.LensService` 存在
4. 確認已調用 `init()` 方法

```javascript
// 調試代碼
console.log('LensService:', window.LensService);
```

### 問題 2: 對話記錄沒有保存

**可能原因：**
1. 沒有傳遞 `userId`
2. API 端點返回錯誤
3. 資料庫連接失敗

**解決方法：**
```javascript
// 開啟調試模式
await window.LensService.init({
  userId: 'your-user-id',
  debug: true, // 開啟調試日誌
});

// 檢查控制台日誌
```

### 問題 3: 用戶對話記錄混淆

**原因：** 沒有正確傳遞 `userId`

**解決方法：**
```javascript
// 確保每次用戶登入/登出時重新初始化
const handleLogin = async (user) => {
  await window.LensService.init({
    userId: user.id, // 傳遞正確的用戶 ID
  });
};

const handleLogout = () => {
  // 清除 widget 狀態
  window.LensService.destroy();
};
```

### 問題 4: API 調用失敗

**檢查：**
1. API 端點是否正確實現
2. CORS 設置是否正確
3. 網絡請求是否成功

```javascript
// 檢查網絡請求
// 打開瀏覽器開發者工具 -> Network 標籤
// 查看 /api/widget/* 請求的狀態
```

---

## 📚 完整範例

### HTML + JavaScript

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>My Website with Lens Service</title>
</head>
<body>
  <h1>歡迎來到我的網站</h1>
  <p>這是一個使用 Lens Service Widget 的範例頁面。</p>
  
  <!-- 引入 Widget -->
  <script src="http://localhost:3000/lens-service.umd.js"></script>
  
  <script>
    // 模擬用戶登入
    const currentUser = {
      id: 'user-123',
      name: 'John Doe',
    };
    
    // 初始化 Widget
    window.addEventListener('DOMContentLoaded', async () => {
      try {
        await window.LensService.init({
          ui: {
            width: '400px',
            position: 'right',
            iconPosition: true,
          },
          userId: currentUser.id,
          debug: true,
        });
        
        console.log('✅ Lens Service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Lens Service:', error);
      }
    });
  </script>
</body>
</html>
```

---

## 🎯 最佳實踐

1. **總是傳遞 userId**
   - 確保每個用戶的對話記錄分開
   - 在用戶登入時初始化 widget
   - 在用戶登出時清除 widget 狀態

2. **使用調試模式開發**
   - 開發時設置 `debug: true`
   - 生產環境設置 `debug: false`

3. **錯誤處理**
   - 使用 try-catch 包裹初始化代碼
   - 監聽錯誤事件

4. **性能優化**
   - 使用 `strategy="beforeInteractive"` 載入腳本
   - 避免重複初始化

5. **安全性**
   - 不要在前端暴露敏感配置
   - 使用環境變數管理 API Key
   - 實現適當的 API 認證

---

## 📞 支援

如有問題，請聯繫：
- Email: support@lens-ai.com
- GitHub: https://github.com/your-org/lens-service
- 文檔: https://docs.lens-ai.com

