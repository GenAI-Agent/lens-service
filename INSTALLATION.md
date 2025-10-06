# Lens Service Widget 安裝指南

這份文檔將指導您如何在您的前端應用中安裝和配置 Lens Service Widget。

## 📋 前置需求

- Node.js 16.x 或更高版本
- npm 或 yarn 套件管理器
- 已設置並運行的 Lens Service 資料庫
- 已啟動的 db-server.js API 服務器

## 🚀 安裝步驟

### 步驟 1：安裝 Widget 套件

從 GitHub 安裝 Lens Service Widget：

```bash
npm install GenAI-Agent/lens-service
```

或使用 yarn：

```bash
yarn add GenAI-Agent/lens-service
```

### 步驟 2：導入 Widget 樣式

在您的主要 CSS 文件或全局樣式文件中導入 Widget 樣式：

```css
/* 在您的 global.css 或 app.css 中 */
@import 'lens-service/dist/style.css';
```

或在 JavaScript/TypeScript 文件中導入：

```javascript
import 'lens-service/dist/style.css';
```

### 步驟 3：創建 Widget 組件

創建一個新的組件文件來包裝 Lens Service Widget。

#### React 範例 (TypeScript)

創建 `components/LensServiceWidget.tsx`：

```typescript
'use client';

import { useEffect, useRef } from 'react';

export default function LensServiceWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<any>(null);

  useEffect(() => {
    const initWidget = async () => {
      if (containerRef.current && !serviceRef.current) {
        try {
          const { LensService } = await import('lens-service');
          
          serviceRef.current = new LensService({
            container: containerRef.current,
            apiBaseUrl: 'http://localhost:3002',
            azureOpenAI: {
              endpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT || '',
              apiKey: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY || '',
              deploymentName: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT || '',
            },
            telegram: {
              botToken: process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '',
              chatId: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || '',
            },
          });

          console.log('✅ LensService initialized successfully');
        } catch (error) {
          console.error('❌ Failed to initialize LensService:', error);
        }
      }
    };

    initWidget();

    return () => {
      if (serviceRef.current) {
        // 清理資源
        serviceRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} />;
}
```

#### React 範例 (JavaScript)

創建 `components/LensServiceWidget.jsx`：

```javascript
'use client';

import { useEffect, useRef } from 'react';

export default function LensServiceWidget() {
  const containerRef = useRef(null);
  const serviceRef = useRef(null);

  useEffect(() => {
    const initWidget = async () => {
      if (containerRef.current && !serviceRef.current) {
        try {
          const { LensService } = await import('lens-service');
          
          serviceRef.current = new LensService({
            container: containerRef.current,
            apiBaseUrl: 'http://localhost:3002',
            azureOpenAI: {
              endpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT || '',
              apiKey: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY || '',
              deploymentName: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT || '',
            },
            telegram: {
              botToken: process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '',
              chatId: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || '',
            },
          });

          console.log('✅ LensService initialized successfully');
        } catch (error) {
          console.error('❌ Failed to initialize LensService:', error);
        }
      }
    };

    initWidget();

    return () => {
      if (serviceRef.current) {
        serviceRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} />;
}
```

### 步驟 4：配置環境變數

創建或更新 `.env.local` 文件：

```env
# Azure OpenAI 配置
NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
NEXT_PUBLIC_AZURE_OPENAI_API_KEY=your-api-key
NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT=your-deployment-name

# Telegram 通知配置
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your-bot-token
NEXT_PUBLIC_TELEGRAM_CHAT_ID=your-chat-id
```

### 步驟 5：在頁面中使用 Widget

#### Next.js App Router 範例

創建或更新頁面文件（例如 `app/page.tsx`）：

```typescript
import LensServiceWidget from '@/components/LensServiceWidget';

export default function Home() {
  return (
    <main>
      <h1>歡迎使用我們的服務</h1>
      {/* 您的其他內容 */}
      
      {/* Lens Service Widget */}
      <LensServiceWidget />
    </main>
  );
}
```

#### Next.js Pages Router 範例

在 `pages/_app.tsx` 或 `pages/_app.jsx` 中：

```typescript
import type { AppProps } from 'next/app';
import LensServiceWidget from '@/components/LensServiceWidget';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <LensServiceWidget />
    </>
  );
}
```

### 步驟 6：創建管理後台頁面

創建管理後台頁面（例如 `app/lens-service/page.tsx`）：

```typescript
'use client';

import { useEffect, useRef } from 'react';

export default function LensServiceAdmin() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initAdmin = async () => {
      if (containerRef.current) {
        try {
          const { AdminPanel } = await import('lens-service');
          
          new AdminPanel({
            container: containerRef.current,
            apiBaseUrl: 'http://localhost:3002',
          });

          console.log('✅ Admin Panel initialized');
        } catch (error) {
          console.error('❌ Failed to initialize Admin Panel:', error);
        }
      }
    };

    initAdmin();
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div ref={containerRef} />
    </div>
  );
}
```

## 🔧 配置選項

### LensService 配置

```typescript
interface LensServiceConfig {
  container: HTMLElement;           // Widget 容器元素
  apiBaseUrl: string;               // API 服務器地址
  azureOpenAI: {
    endpoint: string;               // Azure OpenAI 端點
    apiKey: string;                 // Azure OpenAI API 金鑰
    deploymentName: string;         // 部署名稱
  };
  telegram: {
    botToken: string;               // Telegram Bot Token
    chatId: string;                 // Telegram Chat ID
  };
}
```

### AdminPanel 配置

```typescript
interface AdminPanelConfig {
  container: HTMLElement;           // 管理面板容器元素
  apiBaseUrl: string;               // API 服務器地址
}
```

## 📚 更多資訊

- [Widget API 文檔](./API.md)
- [自定義樣式指南](./STYLING.md)
- [故障排除](./TROUBLESHOOTING.md)

## 🆘 需要幫助？

如果您在安裝過程中遇到問題，請查看：
1. 確保資料庫和 API 服務器正在運行
2. 檢查環境變數是否正確配置
3. 查看瀏覽器控制台的錯誤訊息
4. 參考故障排除文檔

