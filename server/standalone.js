import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cookieParser from "cookie-parser";
import multer from "multer";

// Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Trust proxy for Railway
app.set('trust proxy', 1);

// Middleware
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:");
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple API endpoint to test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// Basic auth routes (simplified for testing)
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple hardcoded check for testing
  if (username === 'superadmin' && password === 'SuperAdmin123!') {
    res.cookie("adminToken", "test-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    
    res.json({
      admin: {
        id: '1',
        username: 'superadmin',
        email: 'admin@vet-dict.com',
        role: 'super_admin'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Serve static files
const distPath = path.resolve(__dirname, "..", "dist", "public");

if (fs.existsSync(distPath)) {
  console.log('📁 Serving static files from:', distPath);
  app.use(express.static(distPath));
  
  // Fall through to index.html
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
} else {
  console.warn('⚠️  No public directory found at:', distPath);
  
  // Basic HTML response
  app.use("*", (_req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Veterinary Dictionary Admin</title></head>
        <body>
          <h1>Server is running!</h1>
          <p>Health check: <a href="/health">/health</a></p>
          <p>API test: <a href="/api/test">/api/test</a></p>
        </body>
      </html>
    `);
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = createServer(app);

// Use Railway's PORT
const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;

server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});