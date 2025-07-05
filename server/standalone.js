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

// Import the actual authentication system
async function initializeAuth() {
  try {
    // Import the authentication module
    const authModule = await import('./auth.js');
    const { SecureAuthService } = authModule;
    
    // Real authentication endpoint
    app.post('/api/admin/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        
        if (!username || !password) {
          return res.status(400).json({ error: 'Username and password required' });
        }
        
        const result = await SecureAuthService.login(username, password, req);
        
        if ('error' in result) {
          return res.status(401).json({ 
            error: result.error,
            remainingTime: result.remainingTime 
          });
        }

        const { admin, token } = result;
        
        // Set HTTP-only cookie
        res.cookie("adminToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 24 * 60 * 60 * 1000,
        });

        res.json({ admin });
        
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    
    // Admin profile endpoint
    app.get('/api/admin/profile', async (req, res) => {
      try {
        const token = req.cookies.adminToken;
        
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }
        
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        const userAgent = req.get('User-Agent') || '';
        
        const session = SecureAuthService.verifyToken(token, ipAddress, userAgent);
        
        if (!session) {
          return res.status(401).json({ error: 'Invalid or expired session' });
        }
        
        const admin = await SecureAuthService.getAdminById(session.adminId);
        
        if (!admin) {
          return res.status(401).json({ error: 'Admin not found' });
        }
        
        res.json({ admin });
        
      } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    
    console.log('✅ Authentication system initialized');
    
  } catch (error) {
    console.error('⚠️  Could not initialize auth system:', error.message);
    
    // Fallback authentication
    app.post('/api/admin/login', (req, res) => {
      res.status(500).json({ error: 'Authentication system unavailable' });
    });
  }
}

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

// Database setup function
async function setupDatabase() {
  try {
    console.log('🗄️  Setting up Railway database...');
    
    // Import and run migrations
    const { execSync } = await import('child_process');
    
    console.log('📊 Running database migrations...');
    execSync('drizzle-kit push', { stdio: 'inherit' });
    
    // Import auth service and create super admin
    console.log('👤 Setting up super admin...');
    const { SecureAuthService } = await import('./auth.js');
    
    // Check if super admin already exists
    try {
      const existingAdmin = await SecureAuthService.getAdminByUsername('superadmin');
      
      if (existingAdmin) {
        console.log('✅ Super admin already exists');
      } else {
        const superAdmin = await SecureAuthService.createAdmin({
          username: 'superadmin',
          email: 'admin@vet-dict.com',
          password: 'SuperAdmin123!',
          role: 'super_admin',
          firstName: 'Super',
          lastName: 'Admin',
        });

        console.log('✅ Super admin created:', superAdmin.username);
      }
    } catch (adminError) {
      console.log('⚠️  Admin setup skipped:', adminError.message);
    }
    
    console.log('🎉 Database setup completed!');
    
  } catch (error) {
    console.error('⚠️  Database setup failed:', error.message);
    console.log('📄 Continuing with server startup...');
  }
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize authentication and start server
async function startServer() {
  // Set up database first in production
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    await setupDatabase();
  }
  
  // Initialize authentication system
  await initializeAuth();
  
  const server = createServer(app);
  
  // Use Railway's PORT
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  
  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});