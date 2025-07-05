import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// IP Whitelist for Private Access
const ALLOWED_IPS = process.env.ALLOWED_IPS 
  ? process.env.ALLOWED_IPS.split(',').map(ip => ip.trim())
  : [
      '127.0.0.1',           // localhost
      '::1',                 // localhost IPv6
      // Add your IPs in .env file as: ALLOWED_IPS=192.168.1.100,203.0.113.45
    ];

// IP restriction middleware (only in production)
app.use((req, res, next) => {
  // Skip IP restriction if disabled or in development
  if (process.env.NODE_ENV === 'development' || process.env.ENABLE_IP_RESTRICTION !== 'true') {
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
  // Prevent the site from being embedded in iframes
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Hide server information
  res.removeHeader('X-Powered-By');
  
  // Add custom security header
  res.setHeader('X-Private-System', 'true');
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Test Firebase connection and enable it if successful
  try {
    console.log('Testing Firebase connection...');
    const { db } = await import('./firebase');
    console.log('Firebase connected successfully!');
    
    // Enable Firebase in hybrid storage
    const { storage } = await import('./storage');
    storage.enableFirebase();
    console.log('Firebase storage enabled');
  } catch (error) {
    console.error('Firebase connection failed, using fallback storage:', error.message);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
