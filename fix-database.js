const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
      sslmode: 'require'
    }
  });

  try {
    console.log('Creating admin_users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        "fullName" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating admin_sessions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id TEXT PRIMARY KEY,
        "adminId" TEXT NOT NULL,
        token TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT,
        "userAgent" TEXT
      )
    `);

    console.log('Creating activity_logs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        "adminId" TEXT NOT NULL,
        action TEXT NOT NULL,
        collection TEXT NOT NULL,
        "documentId" TEXT,
        "documentTitle" TEXT,
        "beforeData" TEXT,
        "afterData" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT,
        "userAgent" TEXT
      )
    `);

    console.log('Creating super admin user...');
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
    
    await pool.query(`
      INSERT INTO admin_users (id, username, email, password, role, "fullName", "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (username) DO NOTHING
    `, [
      'super-admin-001',
      'superadmin', 
      'admin@vet-dict.com',
      hashedPassword,
      'super_admin',
      'Super Administrator',
      true
    ]);

    console.log('✅ Database setup completed successfully!');
    console.log('Login credentials:');
    console.log('Username: superadmin');
    console.log('Password: SuperAdmin123!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase();