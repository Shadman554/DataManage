#!/usr/bin/env node
/**
 * Railway-specific start script
 * Starts the application in Railway production environment
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Railway production server...');

try {
  // Set production environment
  process.env.NODE_ENV = 'production';
  
  // Run database setup if needed
  if (process.env.DATABASE_URL) {
    console.log('📊 Setting up database...');
    try {
      execSync('node railway-setup.js', { stdio: 'inherit', cwd: __dirname });
    } catch (error) {
      console.warn('⚠️  Database setup failed, continuing with app start:', error.message);
    }
  }
  
  // Start the production server
  console.log('🌟 Starting production server...');
  execSync('node dist/production.js', { stdio: 'inherit', cwd: __dirname });
  
} catch (error) {
  console.error('❌ Production start failed:', error.message);
  process.exit(1);
}