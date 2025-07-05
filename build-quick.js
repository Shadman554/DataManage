#!/usr/bin/env node

/**
 * Quick build script for Railway deployment
 */

import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';

console.log('🚀 Quick build for Railway deployment...');

try {
  // Create dist directory
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true });
  }

  // Build frontend only (faster)
  console.log('📦 Building frontend...');
  execSync('vite build --mode production', { stdio: 'inherit' });

  // Build server bundle
  console.log('🔧 Building server...');
  execSync('esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js --sourcemap', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
  console.log('📁 Files ready in ./dist directory');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}