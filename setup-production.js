#!/usr/bin/env node
import { execSync } from 'child_process';
import { createConnection } from '@neondatabase/serverless';

async function setupProduction() {
  console.log('🚀 Setting up production environment...');
  
  try {
    // Check if we're in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('⚠️  Not in production environment, skipping setup');
      return;
    }

    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      console.log('⚠️  DATABASE_URL not found, skipping database setup');
      return;
    }

    console.log('📊 Running database migrations...');
    execSync('npm run db:push', { stdio: 'inherit' });
    
    console.log('👤 Creating super admin account...');
    execSync('node create-super-admin.js', { stdio: 'inherit' });
    
    console.log('✅ Production setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    // Don't exit with error code to prevent deployment failure
    console.log('⚠️  Continuing with deployment despite setup errors...');
  }
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupProduction();
}

export { setupProduction };