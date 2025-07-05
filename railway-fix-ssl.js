#!/usr/bin/env node

/**
 * Railway SSL Fix Script
 * This script helps fix SSL certificate issues on Railway deployments
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './shared/schema.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No DATABASE_URL found');
  process.exit(1);
}

console.log('🔧 Testing Railway database connection with SSL fix...');

// Create connection with proper SSL configuration for Railway
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
    sslmode: 'require'
  },
  // Additional connection settings for Railway
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const db = drizzle(pool, { schema });

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    console.log('📅 Current time:', result.rows[0].current_time);
    
    // Test admin_users table exists
    try {
      const adminCheck = await pool.query('SELECT COUNT(*) FROM admin_users');
      console.log('✅ Admin users table exists with', adminCheck.rows[0].count, 'users');
    } catch (error) {
      console.log('⚠️  Admin users table not found - need to run database setup');
    }
    
    console.log('🎉 Railway database connection is working properly!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
      console.log('💡 SSL certificate issue detected');
      console.log('💡 Make sure your DATABASE_URL includes: sslmode=require');
      console.log('💡 Current URL format should be: postgresql://user:pass@host:port/db?sslmode=require');
    }
  } finally {
    await pool.end();
  }
}

testConnection();