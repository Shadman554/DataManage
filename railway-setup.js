#!/usr/bin/env node

/**
 * Railway Production Setup Script
 * Handles database initialization and admin user creation for Railway deployments
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Define schema inline for Railway deployment
const adminUsers = {
  id: 'text',
  username: 'text',
  email: 'text', 
  password: 'text',
  role: 'text',
  fullName: 'text',
  isActive: 'boolean',
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

console.log('🚀 Railway Production Setup Starting...');

async function setupRailwayDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('📊 Connecting to database...');
  
  try {
    const sql = neon(databaseUrl);
    
    // Test database connection
    console.log('🔍 Testing database connection...');
    await sql`SELECT 1`;
    console.log('✅ Database connection successful');
    
    // Create admin_users table if it doesn't exist
    console.log('📋 Creating admin_users table...');
    await sql`
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
    `;
    
    // Create sessions table
    await sql`
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
    `;
    
    // Create activity_logs table
    await sql`
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
    `;
    
    console.log('✅ Database tables created successfully');
    
    // Check if super admin exists
    console.log('👤 Checking for super admin...');
    const existingAdmin = await sql`
      SELECT * FROM admin_users WHERE username = 'superadmin' LIMIT 1
    `;
    
    if (existingAdmin.length === 0) {
      console.log('🔐 Creating super admin account...');
      
      // Create super admin with strong password
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
      const adminId = crypto.randomUUID();
      
      await sql`
        INSERT INTO admin_users (id, username, email, password, role, "fullName", "isActive", "createdAt", "updatedAt")
        VALUES (${adminId}, 'superadmin', 'admin@vet-dict.com', ${hashedPassword}, 'super_admin', 'Super Administrator', true, NOW(), NOW())
      `;
      
      console.log('✅ Super admin created successfully');
      console.log('📋 Login credentials:');
      console.log('   Username: superadmin');
      console.log('   Password: SuperAdmin123!');
      console.log('   Role: super_admin');
    } else {
      console.log('✅ Super admin already exists');
    }
    
    // Log setup completion
    console.log('🎉 Railway database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.error('Full error:', error.message);
    // Don't exit with error to allow app to continue
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Setup interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Setup terminated');
  process.exit(0);
});

// Run setup
setupRailwayDatabase().catch(error => {
  console.error('💥 Fatal error during setup:', error);
  process.exit(1);
});