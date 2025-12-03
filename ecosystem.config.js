/**
 * PM2 Ecosystem Configuration
 * 用於啟動 Lens Service v3 的所有服務
 */

module.exports = {
  apps: [
    {
      name: 'lens-server',
      script: 'packages/server/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3333,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3333,
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'lens-admin',
      script: 'npx',
      args: 'vite --host --port 5173',
      cwd: './packages/admin',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'development',
        VITE_API_URL: 'http://localhost:3333',
      },
      error_file: './logs/admin-error.log',
      out_file: './logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
