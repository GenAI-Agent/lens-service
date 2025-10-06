const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const app = express();

// 創建資料庫連接
const createDbClient = () => {
  return new Client({
    host: 'localhost',
    port: 5432,
    database: 'lens_service',
    user: 'postgres',
    password: 'postgres',
  });
};

// 中間件
app.use(cors());
app.use(express.json());

// 系統設定路由
app.get('/api/lens/settings', async (req, res) => {
  const client = createDbClient();
  try {
    await client.connect();
    const result = await client.query('SELECT * FROM settings');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await client.end();
  }
});

app.put('/api/lens/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const setting = await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    
    res.json({ success: true, data: setting });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 管理員用戶路由
app.get('/api/lens/admin-users', async (req, res) => {
  try {
    const users = await prisma.adminUser.findMany({
      select: { id: true, username: true, email: true, createdAt: true }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/lens/admin-users', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    const user = await prisma.adminUser.create({
      data: { username, password, email }
    });
    
    res.json({ success: true, data: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    console.error('Create admin user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/lens/admin-users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.adminUser.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Delete admin user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 登入驗證路由
app.post('/api/lens/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await prisma.adminUser.findFirst({
      where: { username, password }
    });
    
    if (user) {
      res.json({ success: true, data: { id: user.id, username: user.username } });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 手動索引路由
app.get('/api/lens/manual-indexes', async (req, res) => {
  try {
    const indexes = await prisma.manualIndex.findMany();
    res.json({ success: true, data: indexes });
  } catch (error) {
    console.error('Get manual indexes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/lens/manual-indexes', async (req, res) => {
  try {
    const { title, content, embedding } = req.body;
    
    const index = await prisma.manualIndex.create({
      data: { title, content, embedding }
    });
    
    res.json({ success: true, data: index });
  } catch (error) {
    console.error('Create manual index error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/lens/manual-indexes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, embedding } = req.body;
    
    const index = await prisma.manualIndex.update({
      where: { id: parseInt(id) },
      data: { title, content, embedding }
    });
    
    res.json({ success: true, data: index });
  } catch (error) {
    console.error('Update manual index error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/lens/manual-indexes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.manualIndex.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Delete manual index error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SQL 查詢路由
app.post('/api/lens/query', async (req, res) => {
  try {
    const { sql, params = [] } = req.body;
    
    const result = await prisma.$queryRawUnsafe(sql, ...params);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('SQL query error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
