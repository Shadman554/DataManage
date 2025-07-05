/**
 * Railway MySQL Setup Script
 * Sets up the MySQL database for Railway deployment
 */

import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config();

async function setupDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log('Setting up MySQL database for Railway...');
  
  try {
    // Create connection
    const connection = await mysql.createConnection(databaseUrl);
    console.log('✓ Connected to MySQL database');

    // Create admin users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'admin',
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP NULL
      )
    `);
    console.log('✓ Created admin_users table');

    // Create activity logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR(255) PRIMARY KEY,
        admin_id VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        collection VARCHAR(50) NOT NULL,
        document_id VARCHAR(255) NOT NULL,
        document_title VARCHAR(500),
        old_data TEXT,
        new_data TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        FOREIGN KEY (admin_id) REFERENCES admin_users(id)
      )
    `);
    console.log('✓ Created activity_logs table');

    // Create admin sessions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id VARCHAR(255) PRIMARY KEY,
        admin_id VARCHAR(255) NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        FOREIGN KEY (admin_id) REFERENCES admin_users(id)
      )
    `);
    console.log('✓ Created admin_sessions table');

    // Create super admin user if it doesn't exist
    const [existing] = await connection.execute(
      'SELECT id FROM admin_users WHERE username = ?',
      ['superadmin']
    );

    if (!existing.length) {
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
      const adminId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await connection.execute(`
        INSERT INTO admin_users (id, username, email, password, role, first_name, last_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        adminId,
        'superadmin',
        'admin@vet-dict.com',
        hashedPassword,
        'super_admin',
        'Super',
        'Admin'
      ]);
      console.log('✓ Created super admin user');
      console.log('  Username: superadmin');
      console.log('  Password: SuperAdmin123!');
    } else {
      console.log('✓ Super admin user already exists');
    }

    await connection.end();
    console.log('✓ Database setup completed successfully');
    
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export { setupDatabase };