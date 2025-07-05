import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import fs from "fs";

// Simple logging function for production (avoiding vite.ts dependency)
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();

// Fix for Railway deployment - use process.cwd() directly for bundled code
const currentDir = process.cwd();

// IP Whitelist for Private Access
const ALLOWED_IPS = process.env.ALLOWED_IPS 
  ? process.env.ALLOWED_IPS.split(',').map(ip => ip.trim())
  : [
      '127.0.0.1',           // localhost
      '::1',                 // localhost IPv6
    ];

// IP restriction middleware (only in production)
app.use((req, res, next) => {
  // Skip IP restriction if disabled or in development
  if (process.env.NODE_ENV === 'development' || process.env.ENABLE_IP_RESTRICTION !== 'true') {
    return next();
  }
  
  // Allow health checks to pass through
  if (req.path === '/health') {
    return next();
  }
  
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Check if IP is in whitelist
  const isAllowed = ALLOWED_IPS.some(allowedIP => {
    return clientIP === allowedIP || clientIP?.includes(allowedIP);
  });
  
  if (!isAllowed) {
    console.log(`🔒 Access denied for IP: ${clientIP}`);
    return res.status(403).json({ 
      error: 'Access denied - This is a private administration system',
      message: 'Your IP address is not authorized to access this system'
    });
  }
  
  console.log(`✅ Access granted for IP: ${clientIP}`);
  next();
});

// Security headers for private system
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:");
  next();
});

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const path = req.path;
    const ip = req.ip || req.connection.remoteAddress;
    
    // Log different colors based on status
    const statusColor = status >= 500 ? '🔴' : status >= 400 ? '🟡' : '🟢';
    
    log(`${statusColor} ${method} ${path} ${status} in ${duration}ms :: ${ip}`);
  });
  
  next();
});

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for Railway
app.set('trust proxy', 1);

(async () => {
  console.log('🚀 Starting Veterinary Dictionary Admin Panel...');
  
  // Load fallback data first
  const { FallbackStorage } = await import('./storage-fallback');
  const fallbackStorage = new FallbackStorage();
  
  // Initialize storage and test connections
  try {
    const { storage } = await import('./storage');
    console.log('Firebase storage enabled');
  } catch (error: any) {
    console.error('Firebase connection failed, using fallback storage:', error?.message || error);
  }

  // Handle Railway production environment
  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 Production environment detected');
    console.log('📊 Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
    console.log('🔒 SSL certificate fix enabled for Railway PostgreSQL');
    
    // Check if database tables exist, if not provide instructions
    if (process.env.DATABASE_URL) {
      console.log('🔒 Using database authentication for Railway deployment');
      console.log('📋 Make sure database tables are created using railway-db-setup.sql');
    } else {
      console.log('⚠️  No DATABASE_URL found, using fallback authentication');
    }
    
    console.log('✅ App starting in production mode...');
  }

  // Serve static files in production BEFORE registering API routes
  const distPath = path.join(currentDir, "dist", "public");
  console.log('📁 Serving static files from:', distPath);
  console.log('📁 Current directory:', currentDir);
  console.log('📁 Directory exists:', fs.existsSync(currentDir));
  console.log('📁 Public directory exists:', fs.existsSync(distPath));
  
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    console.log('✅ Static files configured');
  } else {
    console.warn('⚠️  No public directory found at:', distPath);
  }

  // Register API routes with priority handling
  const server = await registerRoutes(app);

  // Add API route protection middleware - ensures API routes don't fall through to SPA
  app.use('/api/*', (req, res, next) => {
    // If we get here, the API route wasn't found
    res.status(404).json({ error: 'API endpoint not found', path: req.path });
  });

  // Catch-all route for SPA - this must be LAST
  if (fs.existsSync(distPath)) {
    app.use("*", (req, res) => {
      // Only serve index.html for non-API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found', path: req.path });
      }
      
      const indexPath = path.join(distPath, "index.html");
      console.log('📄 Serving index.html from:', indexPath);
      
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).json({ error: 'Frontend not found' });
      }
    });
  } else {
    // Fallback when no static files exist
    app.use("*", (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found', path: req.path });
      }
      res.status(404).json({ error: 'Application not properly built' });
    });
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Use Railway's PORT environment variable in production, otherwise use 5000
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();