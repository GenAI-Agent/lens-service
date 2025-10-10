const { Pool } = require('pg');

async function testDirectConnection() {
  console.log('Testing direct connection to PostgreSQL...');
  
  // 測試不同的配置
  const configs = [
    {
      name: 'Config 1: lens_user with password',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'lens_service',
        user: 'lens_user',
        password: 'lens_password',
        ssl: false,
      }
    },
    {
      name: 'Config 2: lens_user without password',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'lens_service',
        user: 'lens_user',
        ssl: false,
      }
    },
    {
      name: 'Config 3: lens_user with empty password',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'lens_service',
        user: 'lens_user',
        password: '',
        ssl: false,
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`\n=== ${name} ===`);
    
    let pool;
    try {
      pool = new Pool(config);
      
      const client = await pool.connect();
      console.log('✅ Connection successful!');
      
      // 測試查詢
      const result = await client.query('SELECT current_user, current_database(), NOW() as current_time');
      console.log('Query result:', result.rows[0]);
      
      // 測試表查詢
      const tablesResult = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
      console.log('Tables:', tablesResult.rows.map(r => r.table_name));
      
      client.release();
      await pool.end();
      
      console.log('✅ This configuration works!');
      return config;
      
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      console.error('Error code:', error.code);
      if (pool) {
        try {
          await pool.end();
        } catch (e) {
          // ignore
        }
      }
    }
  }
  
  return null;
}

testDirectConnection().then(config => {
  if (config) {
    console.log('\n🎉 Working configuration found!');
    console.log('Use this configuration in your application:');
    console.log(JSON.stringify(config, null, 2));
  } else {
    console.log('\n😞 No working configuration found.');
  }
  process.exit(0);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
