#!/usr/bin/env node

/**
 * Railway SSL Database Setup Script
 * Handles Railway PostgreSQL SSL certificate issues
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './shared/schema.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No DATABASE_URL found');
  process.exit(1);
}

console.log('🔧 Setting up Railway database with SSL bypass...');

// Enhanced SSL configuration for Railway
const sslConfig = {
  rejectUnauthorized: false,
  ca: false,
  key: false,
  cert: false,
  checkServerIdentity: () => undefined,
  secureProtocol: 'TLSv1_2_method'
};

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: sslConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

const db = drizzle(pool, { schema });

async function setupDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test connection
    const testResult = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    
    // Create admin_users table
    console.log('📋 Creating admin_users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        "fullName" TEXT NOT NULL,
        "firstName" TEXT,
        "lastName" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create admin_sessions table
    console.log('📋 Creating admin_sessions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id TEXT PRIMARY KEY,
        "adminId" TEXT NOT NULL,
        "sessionToken" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastActivity" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT,
        "userAgent" TEXT
      )
    `);
    
    // Create activity_logs table
    console.log('📋 Creating activity_logs table...');
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
    
    // Check if super admin exists
    const existingAdmin = await pool.query('SELECT id FROM admin_users WHERE username = $1', ['superadmin']);
    
    if (existingAdmin.rows.length === 0) {
      console.log('👤 Creating super admin user...');
      await pool.query(`
        INSERT INTO admin_users (id, username, email, password, role, "fullName", "firstName", "lastName", "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        'super-admin-001',
        'superadmin',
        'admin@vet-dict.com',
        '$2b$12$LQv3c1yqBwEHFSjHqg8XjuLpP6bWLhxoKGJcqOL3fEQRXgzgJxzfO', // SuperAdmin123!
        'super_admin',
        'Super Administrator',
        'Super',
        'Administrator',
        true
      ]);
      console.log('✅ Super admin created successfully!');
    } else {
      console.log('✅ Super admin already exists');
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('🔐 Login credentials:');
    console.log('   Username: superadmin');
    console.log('   Password: SuperAdmin123!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Export for use in routes
export { setupDatabase };

// Run directly if called as script
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase().catch(console.error);
}