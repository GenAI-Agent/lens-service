#!/usr/bin/env node

require('dotenv').config();
const app = require('./src/server/simple-app');

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🚀 Lens Service API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Database URL: ${process.env.DATABASE_URL}`);
});

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
