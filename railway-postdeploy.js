#!/usr/bin/env node

// Post-deployment script for Railway
// This runs after the app is deployed and healthy

import { execSync } from 'child_process';

async function runPostDeploy() {
  console.log('🚀 Running Railway post-deployment setup...');
  
  try {
    // Wait for server to be ready
    console.log('⏳ Waiting for server to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Run database migrations
    console.log('📊 Running database migrations...');
    execSync('npm run db:push', { stdio: 'inherit' });
    
    // Create super admin
    console.log('👤 Creating super admin account...');
    execSync('tsx create-super-admin.js', { stdio: 'inherit' });
    
    console.log('✅ Railway post-deployment setup completed!');
    
  } catch (error) {
    console.error('❌ Post-deployment setup failed:', error.message);
    console.log('⚠️  This is non-critical, app will continue running');
  }
}

runPostDeploy();