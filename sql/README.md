# Lens Service 資料庫設置

這個目錄包含 Lens Service 的資料庫設置文件。

## 📋 文件說明

- `docker-compose.yml` - Docker Compose 配置文件
- `init.sql` - 資料庫初始化 SQL 腳本
- `setup.sh` - 一鍵安裝腳本（Linux/Mac）
- `setup.ps1` - 一鍵安裝腳本（Windows PowerShell）

## 🚀 快速開始

### Linux / Mac

```bash
# 給予執行權限
chmod +x setup.sh

# 執行安裝腳本
./setup.sh
```

### Windows PowerShell

```powershell
# 執行安裝腳本
.\setup.ps1
```

## 🔧 手動安裝

如果自動安裝腳本無法運行，可以手動執行以下步驟：

### 1. 啟動 Docker 容器

```bash
docker-compose up -d
```

### 2. 等待資料庫啟動

```bash
# 等待 5 秒
sleep 5
```

### 3. 初始化資料庫

```bash
docker exec -i lens-service-db psql -U postgres -d lens_service < init.sql
```

## 📝 資料庫連接資訊

- **主機**: localhost
- **端口**: 5432
- **資料庫**: lens_service
- **用戶**: postgres
- **密碼**: (無密碼，使用 trust 認證)

**連接字串**:
```
postgresql://postgres@localhost:5432/lens_service
```

### 連接到資料庫

```bash
docker exec -it lens-service-db psql -U postgres -d lens_service
```

## 📊 資料庫結構

### conversations 表
- 儲存客服對話記錄
- 包含對話 ID、用戶 ID、訊息內容等

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | SERIAL | 主鍵 |
| conversation_id | VARCHAR(255) | 對話 ID（唯一） |
| user_id | VARCHAR(255) | 用戶 ID |
| status | VARCHAR(50) | 對話狀態 |
| messages | JSONB | 訊息列表 |
| created_at | TIMESTAMP | 創建時間 |
| updated_at | TIMESTAMP | 更新時間 |

### manual_indexes 表
- 儲存手動建立的知識庫索引
- 包含標題、描述、內容等

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | SERIAL | 主鍵 |
| title | VARCHAR(255) | 索引標題 |
| description | TEXT | 索引描述 |
| url | TEXT | 相關網址 |
| content | TEXT | 索引內容 |
| created_at | TIMESTAMP | 創建時間 |
| updated_at | TIMESTAMP | 更新時間 |

### settings 表
- 儲存系統設定
- 包含系統提示詞、預設回覆、llms.txt URL 等

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | SERIAL | 主鍵 |
| key | VARCHAR(255) | 設定鍵（唯一） |
| value | TEXT | 設定值 |
| created_at | TIMESTAMP | 創建時間 |
| updated_at | TIMESTAMP | 更新時間 |

### admin_users 表
- 儲存管理員帳號
- 包含用戶名、密碼、Email 等

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | SERIAL | 主鍵 |
| username | VARCHAR(255) | 用戶名（唯一） |
| password | VARCHAR(255) | 密碼 |
| email | VARCHAR(255) | Email |
| created_at | TIMESTAMP | 創建時間 |

## 🔑 預設帳號

- **用戶名**: lens
- **密碼**: 1234

或

- **用戶名**: admin
- **密碼**: admin123

## 📝 預設數據

安裝腳本會自動插入以下預設數據：

### 系統設定
- `system_prompt`: 系統提示詞
- `default_reply`: 無法回答時的預設回覆
- `llms_txt_url`: LLMs.txt 網址（初始為空）

### 手動索引
- 客服聯絡方式
- 產品價格資訊

## 🛠️ 常用命令

### 查看容器狀態
```bash
docker ps
```

### 查看容器日誌
```bash
docker logs lens-service-db
```

### 進入資料庫
```bash
docker exec -it lens-service-db psql -U postgres -d lens_service
```

### 停止容器
```bash
docker-compose down
```

### 重新啟動容器
```bash
docker-compose restart
```

### 清除所有數據並重新開始
```bash
docker-compose down -v
./setup.sh
```

## 📚 SQL 查詢範例

```sql
-- 查詢所有對話
SELECT * FROM conversations ORDER BY created_at DESC;

-- 查詢特定對話的訊息
SELECT conversation_id, messages FROM conversations WHERE conversation_id = 'conv-xxx';

-- 查詢所有手動索引
SELECT * FROM manual_indexes ORDER BY created_at DESC;

-- 搜尋索引內容
SELECT * FROM manual_indexes WHERE content LIKE '%客服%';

-- 查詢系統設定
SELECT * FROM settings;

-- 查詢所有管理員
SELECT username, email, created_at FROM admin_users;
```

## 🔍 故障排除

### 問題：容器無法啟動

**解決方案**:
1. 檢查 5432 端口是否被占用
2. 查看 Docker 日誌：`docker logs lens-service-db`
3. 確保 Docker 服務正在運行

### 問題：資料庫初始化失敗

**解決方案**:
1. 確保容器已完全啟動（等待 5-10 秒）
2. 手動執行初始化腳本
3. 檢查 init.sql 文件是否存在

### 問題：無法連接資料庫

**解決方案**:
1. 確認容器正在運行：`docker ps`
2. 檢查端口映射是否正確
3. 嘗試重新啟動容器：`docker-compose restart`

### 問題：端口被佔用

如果 5432 端口被佔用，修改 `docker-compose.yml`：

```yaml
ports:
  - "5433:5432"  # 改用 5433
```

然後更新連接資訊中的端口號。

## 📚 更多資訊

請參考主項目的 README.md 文件以獲取完整的使用說明。

