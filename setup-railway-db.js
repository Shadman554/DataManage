#!/usr/bin/env node

// Railway database setup script
import { execSync } from 'child_process';

async function setupRailwayDatabase() {
  console.log('🚀 Setting up Railway database...');
  
  try {
    // Run database migrations
    console.log('📊 Running database migrations...');
    execSync('drizzle-kit push', { stdio: 'inherit' });
    
    // Create super admin
    console.log('👤 Creating super admin account...');
    
    // Import auth service directly
    const { SecureAuthService } = await import('./server/auth.js');
    
    // Check if super admin already exists
    const existingAdmin = await SecureAuthService.getAdminByUsername('superadmin');
    
    if (existingAdmin) {
      console.log('✅ Super admin already exists');
    } else {
      const superAdmin = await SecureAuthService.createAdmin({
        username: 'superadmin',
        email: 'admin@vet-dict.com',
        password: 'SuperAdmin123!',
        role: 'super_admin',
        firstName: 'Super',
        lastName: 'Admin',
      });

      console.log('✅ Super admin created successfully:', {
        id: superAdmin.id,
        username: superAdmin.username,
        email: superAdmin.email,
        role: superAdmin.role,
      });
    }
    
    console.log('🎉 Railway database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupRailwayDatabase();