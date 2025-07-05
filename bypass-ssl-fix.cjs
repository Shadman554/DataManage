const { Pool } = require('pg');

// Create a simple test that bypasses SSL properly
async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
      sslmode: 'require'
    }
  });

  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0]);
    
    // Test if our tables exist
    const tableCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'admin_users'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ admin_users table exists');
      
      // Check if super admin exists
      const adminCheck = await pool.query(
        'SELECT username, role FROM admin_users WHERE username = $1',
        ['superadmin']
      );
      
      if (adminCheck.rows.length > 0) {
        console.log('✅ Super admin exists:', adminCheck.rows[0]);
        console.log('🎉 Database is fully configured!');
        console.log('You can now login to your Railway app with:');
        console.log('Username: superadmin');
        console.log('Password: SuperAdmin123!');
      } else {
        console.log('❌ Super admin not found');
      }
    } else {
      console.log('❌ admin_users table not found');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await pool.end();
  }
}

testConnection();