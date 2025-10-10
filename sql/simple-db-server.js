const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

// 執行PostgreSQL查詢的函數
function executeQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    const psqlArgs = [
      '-h', 'localhost',
      '-p', '5432',
      '-U', 'lens_user',
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

// 解析查詢結果的函數
function parseQueryResult(result, columns) {
  if (!result || result.trim() === '') {
    return [];
  }

  const lines = result.trim().split('\n');
  const rows = [];

  for (const line of lines) {
    if (line.trim() === '') continue;

    const values = line.split('|');
    const row = {};

    for (let i = 0; i < columns.length && i < values.length; i++) {
      const value = values[i]?.trim();
      const column = columns[i];

      // 處理不同的數據類型
      if (value === '' || value === 'null') {
        row[column] = null;
      } else if (column.includes('enabled') || column.includes('auto_update')) {
        row[column] = value === 't' || value === 'true';
      } else if (column.includes('_pages') || column.includes('interval')) {
        row[column] = parseInt(value) || 0;
      } else {
        row[column] = value;
      }
    }

    rows.push(row);
  }

  return rows;
}

// 健康檢查
app.get('/health', async (req, res) => {
  try {
    const result = await executeQuery('SELECT NOW() as current_time');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: result
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// 獲取規則
app.get('/rules', async (req, res) => {
  try {
    // 暫時返回空數組，避免404錯誤
    res.json([]);
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

// 創建規則
app.post('/rules', async (req, res) => {
  try {
    // 暫時返回成功響應
    res.json({ success: true, message: 'Rule created' });
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

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
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// 保存對話
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
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

// 回覆對話
app.post('/conversations/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 獲取現有對話
    const getQuery = `
      SELECT messages FROM conversations WHERE id = '${id}'
    `;
    const result = await executeQuery(getQuery);
    const rows = parsePostgresOutput(result, ['messages']);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // 解析現有消息
    let messages = [];
    try {
      messages = typeof rows[0].messages === 'string' ? JSON.parse(rows[0].messages) : rows[0].messages;
    } catch (e) {
      console.error('Error parsing messages:', e);
      messages = [];
    }

    // 添加新的回覆消息
    const newMessage = {
      role: 'assistant',
      content: message,
      timestamp: new Date().toISOString(),
      isAdminReply: true
    };
    messages.push(newMessage);

    // 更新對話
    const updateQuery = `
      UPDATE conversations
      SET messages = '${JSON.stringify(messages)}'::jsonb, updated_at = CURRENT_TIMESTAMP
      WHERE id = '${id}'
    `;
    await executeQuery(updateQuery);

    res.json({ success: true, message: 'Reply added successfully' });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// 刪除對話
app.delete('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = `
      DELETE FROM conversations WHERE id = '${id}'
    `;
    await executeQuery(deleteQuery);

    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// 獲取手動索引
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

// 刪除手動索引
app.delete('/manual-indexes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `DELETE FROM manual_indexes WHERE id = '${id}' RETURNING *`;
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

// 保存對話
app.post('/conversations', async (req, res) => {
  try {
    const { id, user_id, conversation_id, message, response, sources } = req.body;
    
    const query = `
      INSERT INTO conversations (id, user_id, conversation_id, message, response, sources)
      VALUES ('${id}', '${user_id}', '${conversation_id}', '${message}', '${response}', '${JSON.stringify(sources || [])}')
      RETURNING *
    `;
    
    const result = await executeQuery(query);
    res.json({ message: 'Conversation saved successfully' });
  } catch (error) {
    console.error('Failed to save conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Sitemap API ====================

// 獲取所有sitemap配置
app.get('/sitemap-configs', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT id, name, domain, sitemap_url, enabled, auto_update,
             update_interval, last_crawled_at, crawl_status,
             total_pages, indexed_pages, created_at, updated_at
      FROM sitemap_configs
      ORDER BY created_at DESC
    `);

    const configs = parseQueryResult(result, [
      'id', 'name', 'domain', 'sitemap_url', 'enabled', 'auto_update',
      'update_interval', 'last_crawled_at', 'crawl_status',
      'total_pages', 'indexed_pages', 'created_at', 'updated_at'
    ]);

    res.json(configs);
  } catch (error) {
    console.error('Failed to get sitemap configs:', error);
    res.status(500).json({ error: error.message });
  }
});

// 創建sitemap配置
app.post('/sitemap-configs', async (req, res) => {
  try {
    const { name, domain, sitemap_url, enabled = true, auto_update = false, update_interval = 60 } = req.body;

    if (!name || !domain || !sitemap_url) {
      return res.status(400).json({ error: 'Missing required fields: name, domain, sitemap_url' });
    }

    const result = await executeQuery(`
      INSERT INTO sitemap_configs (name, domain, sitemap_url, enabled, auto_update, update_interval)
      VALUES ('${name}', '${domain}', '${sitemap_url}', ${enabled}, ${auto_update}, ${update_interval})
      RETURNING id, name, domain, sitemap_url, enabled, auto_update, update_interval, created_at
    `);

    const config = parseQueryResult(result, [
      'id', 'name', 'domain', 'sitemap_url', 'enabled', 'auto_update', 'update_interval', 'created_at'
    ])[0];

    res.status(201).json(config);
  } catch (error) {
    console.error('Failed to create sitemap config:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新sitemap配置
app.put('/sitemap-configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, domain, sitemap_url, enabled, auto_update, update_interval } = req.body;

    const updates = [];
    if (name !== undefined) updates.push(`name = '${name}'`);
    if (domain !== undefined) updates.push(`domain = '${domain}'`);
    if (sitemap_url !== undefined) updates.push(`sitemap_url = '${sitemap_url}'`);
    if (enabled !== undefined) updates.push(`enabled = ${enabled}`);
    if (auto_update !== undefined) updates.push(`auto_update = ${auto_update}`);
    if (update_interval !== undefined) updates.push(`update_interval = ${update_interval}`);

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const result = await executeQuery(`
      UPDATE sitemap_configs
      SET ${updates.join(', ')}
      WHERE id = '${id}'
      RETURNING id, name, domain, sitemap_url, enabled, auto_update, update_interval, updated_at
    `);

    const config = parseQueryResult(result, [
      'id', 'name', 'domain', 'sitemap_url', 'enabled', 'auto_update', 'update_interval', 'updated_at'
    ])[0];

    if (!config) {
      return res.status(404).json({ error: 'Sitemap config not found' });
    }

    res.json(config);
  } catch (error) {
    console.error('Failed to update sitemap config:', error);
    res.status(500).json({ error: error.message });
  }
});

// 刪除sitemap配置
app.delete('/sitemap-configs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery(`
      DELETE FROM sitemap_configs WHERE id = '${id}'
      RETURNING id
    `);

    const deleted = parseQueryResult(result, ['id'])[0];

    if (!deleted) {
      return res.status(404).json({ error: 'Sitemap config not found' });
    }

    res.json({ message: 'Sitemap config deleted successfully' });
  } catch (error) {
    console.error('Failed to delete sitemap config:', error);
    res.status(500).json({ error: error.message });
  }
});

// 觸發sitemap爬取
app.post('/sitemap-configs/:id/crawl', async (req, res) => {
  try {
    const { id } = req.params;
    const { crawl_type = 'manual' } = req.body;

    // 更新爬取狀態
    await executeQuery(`
      UPDATE sitemap_configs
      SET crawl_status = 'running', last_crawled_at = CURRENT_TIMESTAMP
      WHERE id = '${id}'
    `);

    // 創建爬取日誌
    await executeQuery(`
      INSERT INTO sitemap_crawl_logs (sitemap_config_id, crawl_type, status)
      VALUES ('${id}', '${crawl_type}', 'running')
    `);

    res.json({ message: 'Crawl started successfully' });
  } catch (error) {
    console.error('Failed to start crawl:', error);
    res.status(500).json({ error: error.message });
  }
});

// 獲取sitemap頁面
app.get('/sitemap-pages', async (req, res) => {
  try {
    const { sitemap_config_id, limit = 50, offset = 0 } = req.query;

    let whereClause = '';
    if (sitemap_config_id) {
      whereClause = `WHERE sitemap_config_id = '${sitemap_config_id}'`;
    }

    const result = await executeQuery(`
      SELECT id, sitemap_config_id, url, title, meta_description,
             last_crawled_at, crawl_status, created_at
      FROM sitemap_pages
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const pages = parseQueryResult(result, [
      'id', 'sitemap_config_id', 'url', 'title', 'meta_description',
      'last_crawled_at', 'crawl_status', 'created_at'
    ]);

    res.json(pages);
  } catch (error) {
    console.error('Failed to get sitemap pages:', error);
    res.status(500).json({ error: error.message });
  }
});

// 搜尋sitemap頁面
app.get('/sitemap-pages/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const result = await executeQuery(`
      SELECT id, url, title, content, meta_description, fingerprint
      FROM sitemap_pages
      WHERE crawl_status = 'success'
        AND (title ILIKE '%${query}%' OR content ILIKE '%${query}%' OR meta_description ILIKE '%${query}%')
      ORDER BY
        CASE
          WHEN title ILIKE '%${query}%' THEN 1
          WHEN meta_description ILIKE '%${query}%' THEN 2
          ELSE 3
        END
      LIMIT ${limit}
    `);

    const pages = parseQueryResult(result, [
      'id', 'url', 'title', 'content', 'meta_description', 'fingerprint'
    ]);

    res.json(pages);
  } catch (error) {
    console.error('Failed to search sitemap pages:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Simple database server running on port ${port}`);
});
