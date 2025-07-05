#!/usr/bin/env node

// Production build script that works with Node.js 18
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Building for production...');

try {
  // Build frontend using the production vite config
  console.log('📦 Building frontend...');
  execSync('vite build --config vite.config.prod.ts', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  
  // Build backend
  console.log('🔧 Building backend...');
  execSync('esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --define:import.meta.dirname=\'"./"\'', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('✅ Production build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}