const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');

// 加載前端的 .env 文件
dotenv.config({ path: path.join(__dirname, '../Quant07_frontend/.env') });

const app = express();
const port = 3002;

// 執行PostgreSQL查詢的函數 (使用 docker exec psql)
function executeQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    const psqlArgs = [
      '-U', 'postgres',
      '-d', 'lens_service',
      '-t', // 只輸出數據，不輸出表頭
      '-A', // 不對齊輸出
      '-c', query
    ];

    const psql = spawn('docker', ['exec', '-i', 'lens-service-db', 'psql', ...psqlArgs]);

    let stdout = '';
    let stderr = '';

    psql.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    psql.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    psql.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`PostgreSQL query failed: ${stderr}`));
      }
    });

    psql.on('error', (error) => {
      reject(error);
    });
  });
}

// 解析PostgreSQL輸出為JSON
function parsePostgresOutput(output, columns) {
  if (!output) return [];

  const lines = output.split('\n').filter(line => line.trim());
  return lines.map(line => {
    const values = line.split('|');
    const row = {};
    columns.forEach((col, index) => {
      row[col] = values[index] ? values[index].trim() : null;
    });
    return row;
  });
}

// 測試數據庫連接
executeQuery('SELECT NOW() as current_time').then(result => {
  console.log('✅ Database connected successfully');
}).catch(err => {
  console.error('❌ Database connection failed:', err);
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ==================== Conversations API ====================

// 獲取所有對話
app.get('/conversations', async (req, res) => {
  try {
    const query = `
      SELECT id, user_id, conversation_id, messages, created_at, updated_at
      FROM conversations
      ORDER BY created_at DESC
    `;
    const result = await executeQuery(query);
    const rows = parsePostgresOutput(result, ['id', 'user_id', 'conversation_id', 'messages', 'created_at', 'updated_at']);

    // 轉換JSONB messages格式為前端需要的格式
    const formattedRows = rows.map(row => {
      let messages = [];
      try {
        messages = typeof row.messages === 'string' ? JSON.parse(row.messages) : row.messages;
      } catch (e) {
        console.error('Error parsing messages JSON:', e);
        messages = [];
      }

      return {
        ...row,
        messages: messages,
        lastMessage: messages.length > 0 ? messages[messages.length - 1] : null
      };
    });

    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: error.message });
  }
});

// 獲取單個對話
app.get('/conversations/:id', async (req, res) => {
  try {
    const query = `SELECT * FROM conversations WHERE conversation_id = '${req.params.id}'`;
    const result = await executeQuery(query);
    const rows = parsePostgresOutput(result, ['id', 'user_id', 'conversation_id', 'messages', 'created_at', 'updated_at']);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// 創建或更新對話
app.post('/conversations', async (req, res) => {
  try {
    const { user_id, conversation_id, messages } = req.body;

    if (!user_id || !conversation_id || !messages) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 檢查對話是否已存在
    const checkQuery = `
      SELECT id FROM conversations WHERE conversation_id = '${conversation_id}'
    `;
    const existingResult = await executeQuery(checkQuery);
    const existingRows = parsePostgresOutput(existingResult, ['id']);

    if (existingRows.length > 0) {
      // 更新現有對話
      const updateQuery = `
        UPDATE conversations
        SET messages = '${JSON.stringify(messages)}'::jsonb, updated_at = CURRENT_TIMESTAMP
        WHERE conversation_id = '${conversation_id}'
      `;
      await executeQuery(updateQuery);
      res.json({ success: true, message: 'Conversation updated' });
    } else {
      // 創建新對話
      const insertQuery = `
        INSERT INTO conversations (user_id, conversation_id, messages)
        VALUES ('${user_id}', '${conversation_id}', '${JSON.stringify(messages)}'::jsonb)
      `;
      await executeQuery(insertQuery);
      res.json({ success: true, message: 'Conversation created' });
    }
  } catch (error) {
    console.error('Error saving conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// 刪除對話
app.delete('/conversations/:id', async (req, res) => {
  try {
    const deleteQuery = `DELETE FROM conversations WHERE conversation_id = '${req.params.id}'`;
    await executeQuery(deleteQuery);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Manual Indexes API ====================

// 獲取所有手動索引
app.get('/manual-indexes', async (req, res) => {
  try {
    const query = `
      SELECT id, name, description, content, url, keywords, fingerprint,
             embedding, metadata, created_at, updated_at
      FROM manual_indexes
      ORDER BY created_at DESC
    `;

    const result = await executeQuery(query);
    const columns = ['id', 'name', 'description', 'content', 'url', 'keywords', 'fingerprint', 'embedding', 'metadata', 'created_at', 'updated_at'];
    const indexes = parsePostgresOutput(result, columns);

    // 解析JSON字段
    const parsedIndexes = indexes.map(row => ({
      ...row,
      keywords: row.keywords ? JSON.parse(row.keywords) : [],
      embedding: row.embedding ? JSON.parse(row.embedding) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }));

    res.json(parsedIndexes);
  } catch (error) {
    console.error('Failed to fetch manual indexes:', error);
    res.status(500).json({ error: error.message });
  }
});

// 創建手動索引
app.post('/manual-indexes', async (req, res) => {
  try {
    const { id, name, description, content, url, keywords, fingerprint, embedding, metadata } = req.body;

    const query = `
      INSERT INTO manual_indexes (id, name, description, content, url, keywords, fingerprint, embedding, metadata)
      VALUES ('${id}', '${name}', '${description}', '${content}', '${url || ''}', '${JSON.stringify(keywords || [])}', '${fingerprint}', '${JSON.stringify(embedding || null)}', '${JSON.stringify(metadata || {})}')
      ON CONFLICT (fingerprint) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        content = EXCLUDED.content,
        url = EXCLUDED.url,
        keywords = EXCLUDED.keywords,
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await executeQuery(query);
    const columns = ['id', 'name', 'description', 'content', 'url', 'keywords', 'fingerprint', 'embedding', 'metadata', 'created_at', 'updated_at'];
    const indexes = parsePostgresOutput(result, columns);

    if (indexes.length > 0) {
      const index = indexes[0];
      res.json({
        ...index,
        keywords: index.keywords ? JSON.parse(index.keywords) : [],
        embedding: index.embedding ? JSON.parse(index.embedding) : null,
        metadata: index.metadata ? JSON.parse(index.metadata) : {}
      });
    } else {
      res.status(500).json({ error: 'Failed to create index' });
    }
  } catch (error) {
    console.error('Failed to create manual index:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新手動索引
app.put('/manual-indexes/:id', async (req, res) => {
  try {
    const { name, description, content, url, keywords } = req.body;

    const query = `
      UPDATE manual_indexes
      SET name = '${name}', description = '${description}', content = '${content}', url = '${url || ''}', keywords = '${JSON.stringify(keywords || [])}', updated_at = CURRENT_TIMESTAMP
      WHERE id = '${req.params.id}'
      RETURNING *
    `;

    const result = await executeQuery(query);
    const columns = ['id', 'name', 'description', 'content', 'url', 'keywords', 'fingerprint', 'embedding', 'metadata', 'created_at', 'updated_at'];
    const indexes = parsePostgresOutput(result, columns);

    if (indexes.length === 0) {
      return res.status(404).json({ error: 'Manual index not found' });
    }

    res.json(indexes[0]);
  } catch (error) {
    console.error('Error updating manual index:', error);
    res.status(500).json({ error: error.message });
  }
});

// 刪除手動索引
app.delete('/manual-indexes/:id', async (req, res) => {
  try {
    const query = `DELETE FROM manual_indexes WHERE id = '${req.params.id}' RETURNING *`;
    const result = await executeQuery(query);

    if (result.trim()) {
      res.json({ message: 'Index deleted successfully' });
    } else {
      res.status(404).json({ error: 'Index not found' });
    }
  } catch (error) {
    console.error('Failed to delete manual index:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Settings API ====================

// 獲取所有設定
app.get('/settings', async (req, res) => {
  try {
    const query = `SELECT key, value FROM settings`;
    const result = await executeQuery(query);
    const rows = parsePostgresOutput(result, ['key', 'value']);

    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// 獲取單個設定
app.get('/settings/:key', async (req, res) => {
  try {
    const query = `SELECT value FROM settings WHERE key = '${req.params.key}'`;
    const result = await executeQuery(query);
    const rows = parsePostgresOutput(result, ['value']);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.json({ value: rows[0].value });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新設定
app.put('/settings/:key', async (req, res) => {
  try {
    const { value } = req.body;

    const query = `
      INSERT INTO settings (key, value)
      VALUES ('${req.params.key}', '${value}')
      ON CONFLICT (key)
      DO UPDATE SET value = '${value}', updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await executeQuery(query);
    const rows = parsePostgresOutput(result, ['id', 'key', 'value', 'created_at', 'updated_at']);

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Admin Users API ====================

// 獲取所有管理員
app.get('/admin-users', async (req, res) => {
  try {
    const query = `SELECT id, username, email, role, created_at FROM admin_users`;
    const result = await executeQuery(query);
    const rows = parsePostgresOutput(result, ['id', 'username', 'email', 'role', 'created_at']);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: error.message });
  }
});

// 驗證管理員登入
app.post('/admin-users/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const query = `
      SELECT id, username, email, role FROM admin_users
      WHERE username = '${username}' AND password_hash = '${password}'
    `;
    const result = await executeQuery(query);
    const rows = parsePostgresOutput(result, ['id', 'username', 'email', 'role']);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: error.message });
  }
});

// 創建管理員
app.post('/admin-users', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    const query = `
      INSERT INTO admin_users (username, password_hash, email)
      VALUES ('${username}', '${password}', '${email}')
      RETURNING id, username, email, created_at
    `;
    const result = await executeQuery(query);
    const rows = parsePostgresOutput(result, ['id', 'username', 'email', 'created_at']);

    res.json(rows[0]);
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: error.message });
  }
});

// 刪除管理員
app.delete('/admin-users/:id', async (req, res) => {
  try {
    const query = `DELETE FROM admin_users WHERE id = '${req.params.id}'`;
    await executeQuery(query);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    res.status(500).json({ error: error.message });
  }
});

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`✅ Database API server running on http://localhost:${port}`);
  console.log(`📊 Database: ${process.env.NEXT_PUBLIC_DB_NAME}@${process.env.NEXT_PUBLIC_DB_HOST}:${process.env.NEXT_PUBLIC_DB_PORT}`);
});

