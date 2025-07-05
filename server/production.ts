import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const app = express();

// Get current directory path in a way that works in bundled code
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Skip automatic database setup in production - do it manually
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    console.log('🚀 Production environment detected');
    console.log('📊 Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
    console.log('✅ App starting in production mode...');
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve static files in production
  const distPath = path.resolve(__dirname, "public");
  
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    // Fall through to index.html if the file doesn't exist
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    console.warn('⚠️  No public directory found, serving basic API only');
  }

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