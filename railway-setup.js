#!/usr/bin/env node

/**
 * Railway Production Setup Script
 * Handles database initialization and admin user creation for Railway deployments
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { adminUsers, adminSessions, activityLogs } from './shared/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

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
    const db = drizzle(sql);
    
    // Test database connection
    console.log('🔍 Testing database connection...');
    await sql`SELECT 1`;
    console.log('✅ Database connection successful');
    
    // Check if super admin exists
    console.log('👤 Checking for super admin...');
    const existingAdmin = await db.select().from(adminUsers).where(eq(adminUsers.username, 'superadmin')).limit(1);
    
    if (existingAdmin.length === 0) {
      console.log('🔐 Creating super admin account...');
      
      // Create super admin with strong password
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
      const adminId = crypto.randomUUID();
      
      await db.insert(adminUsers).values({
        id: adminId,
        username: 'superadmin',
        email: 'admin@vet-dict.com',
        password: hashedPassword,
        role: 'super_admin',
        fullName: 'Super Administrator',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
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
    process.exit(1);
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