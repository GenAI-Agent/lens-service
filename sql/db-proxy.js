const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 3002;

// 中間件
app.use(cors());
app.use(express.json());

// PostgreSQL連接池 - 直接在容器網絡中連接
let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      host: 'lens-service-db',  // Docker容器名稱
      port: 5432,
      database: 'lens_service',
      user: 'postgres',
      password: '',
      ssl: false,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

// 健康檢查
app.get('/health', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT NOW() as current_time');
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].current_time
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

// 獲取手動索引
app.get('/manual-indexes', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT id, name, description, content, keywords, fingerprint,
             embedding, metadata, created_at, updated_at
      FROM manual_indexes
      ORDER BY created_at DESC
    `);

    const indexes = result.rows.map(row => ({
      ...row,
      keywords: row.keywords ? JSON.parse(row.keywords) : [],
      embedding: row.embedding ? JSON.parse(row.embedding) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }));

    res.json(indexes);
  } catch (error) {
    console.error('Failed to fetch manual indexes:', error);
    res.status(500).json({ error: error.message });
  }
});

// 創建手動索引
app.post('/manual-indexes', async (req, res) => {
  try {
    const { id, name, description, content, keywords, fingerprint, embedding, metadata } = req.body;
    
    const pool = getPool();
    const result = await pool.query(`
      INSERT INTO manual_indexes (id, name, description, content, keywords, fingerprint, embedding, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      id,
      name,
      description,
      content,
      JSON.stringify(keywords || []),
      fingerprint,
      JSON.stringify(embedding || null),
      JSON.stringify(metadata || {})
    ]);

    const index = result.rows[0];
    res.json({
      ...index,
      keywords: index.keywords ? JSON.parse(index.keywords) : [],
      embedding: index.embedding ? JSON.parse(index.embedding) : null,
      metadata: index.metadata ? JSON.parse(index.metadata) : {}
    });
  } catch (error) {
    console.error('Failed to create manual index:', error);
    res.status(500).json({ error: error.message });
  }
});

// 刪除手動索引
app.delete('/manual-indexes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = getPool();
    const result = await pool.query('DELETE FROM manual_indexes WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Index not found' });
    }

    res.json({ message: 'Index deleted successfully' });
  } catch (error) {
    console.error('Failed to delete manual index:', error);
    res.status(500).json({ error: error.message });
  }
});

// 保存對話
app.post('/conversations', async (req, res) => {
  try {
    const { id, user_id, conversation_id, message, response, sources } = req.body;
    
    const pool = getPool();
    const result = await pool.query(`
      INSERT INTO conversations (id, user_id, conversation_id, message, response, sources)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [id, user_id, conversation_id, message, response, JSON.stringify(sources || [])]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to save conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Database proxy server running on port ${port}`);
});
