#!/usr/bin/env node
/**
 * Railway-specific build script
 * Builds the application for Railway production deployment
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Building for Railway deployment...');

try {
  // Build frontend
  console.log('📦 Building frontend...');
  execSync('vite build', { stdio: 'inherit', cwd: __dirname });
  
  // Build backend with production server
  console.log('🔧 Building backend...');
  execSync('esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --outfile=dist/index.js', { stdio: 'inherit', cwd: __dirname });
  
  console.log('✅ Build completed successfully');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}