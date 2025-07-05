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

// Simple authentication system for production
async function initializeAuth() {
  try {
    // Import required modules
    const bcrypt = await import('bcrypt');
    const jwt = await import('jsonwebtoken');
    const { Client } = await import('pg');
    
    const JWT_SECRET = process.env.JWT_SECRET || 'VetDict2025SecureJWTKeyForProductionUseChangeThisToSomethingLongAndRandomForSecurity';
    
    // Simple auth service
    const AuthService = {
      async validateUser(username, password) {
        let config;
        if (process.env.DATABASE_URL.includes('railway')) {
          config = {
            connectionString: process.env.DATABASE_URL,
            ssl: {
              rejectUnauthorized: false,
              ca: false,
              key: false,
              cert: false
            }
          };
        } else {
          config = {
            connectionString: process.env.DATABASE_URL
          };
        }
        
        const client = new Client(config);
        
        await client.connect();
        
        const result = await client.query(
          'SELECT * FROM admin_users WHERE username = $1 AND is_active = true',
          [username]
        );
        
        await client.end();
        
        if (result.rows.length === 0) {
          return null;
        }
        
        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        
        return isValid ? user : null;
      },
      
      generateToken(userId) {
        return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
      },
      
      verifyToken(token) {
        try {
          return jwt.verify(token, JWT_SECRET);
        } catch {
          return null;
        }
      }
    };
    
    // Real authentication endpoint
    app.post('/api/admin/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        
        if (!username || !password) {
          return res.status(400).json({ error: 'Username and password required' });
        }
        
        const admin = await AuthService.validateUser(username, password);
        
        if (!admin) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = AuthService.generateToken(admin.id);
        
        // Set HTTP-only cookie
        res.cookie("adminToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 24 * 60 * 60 * 1000,
        });

        // Remove password hash from response
        const { password_hash, ...adminData } = admin;
        res.json({ admin: adminData });
        
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
        
        const decoded = AuthService.verifyToken(token);
        
        if (!decoded) {
          return res.status(401).json({ error: 'Invalid or expired session' });
        }
        
        // Get admin from database
        const { Client } = await import('pg');
        let config;
        if (process.env.DATABASE_URL.includes('railway')) {
          config = {
            connectionString: process.env.DATABASE_URL,
            ssl: {
              rejectUnauthorized: false,
              ca: false,
              key: false,
              cert: false
            }
          };
        } else {
          config = {
            connectionString: process.env.DATABASE_URL
          };
        }
        
        const client = new Client(config);
        
        await client.connect();
        
        const result = await client.query(
          'SELECT id, username, email, role, first_name, last_name, is_active, created_at FROM admin_users WHERE id = $1',
          [decoded.userId]
        );
        
        await client.end();
        
        if (result.rows.length === 0) {
          return res.status(401).json({ error: 'Admin not found' });
        }
        
        res.json({ admin: result.rows[0] });
        
      } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    
    console.log('✅ Authentication system initialized');
    
  } catch (error) {
    console.error('⚠️  Could not initialize auth system:', error.message);
    
    // Fallback authentication for when database tables don't exist
    app.post('/api/admin/login', (req, res) => {
      const { username, password } = req.body;
      
      // Allow superadmin login even if database setup failed
      if (username === 'superadmin' && password === 'SuperAdmin123!') {
        const token = 'fallback-token-' + Date.now();
        
        res.cookie("adminToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 24 * 60 * 60 * 1000,
        });

        res.json({
          admin: {
            id: 'fallback-admin',
            username: 'superadmin',
            email: 'admin@vet-dict.com',
            role: 'super_admin',
            first_name: 'Super',
            last_name: 'Admin'
          }
        });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });
    
    app.get('/api/admin/profile', (req, res) => {
      const token = req.cookies.adminToken;
      
      if (token && token.startsWith('fallback-token-')) {
        res.json({
          admin: {
            id: 'fallback-admin',
            username: 'superadmin',
            email: 'admin@vet-dict.com',
            role: 'super_admin',
            first_name: 'Super',
            last_name: 'Admin'
          }
        });
      } else {
        res.status(401).json({ error: 'No token provided' });
      }
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
    
    // Direct database connection for setup
    const { Client } = await import('pg');
    // Parse DATABASE_URL and configure SSL properly for Railway
    let config;
    if (process.env.DATABASE_URL.includes('railway')) {
      config = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
          ca: false,
          key: false,
          cert: false
        }
      };
    } else {
      config = {
        connectionString: process.env.DATABASE_URL
      };
    }
    
    const client = new Client(config);
    
    await client.connect();
    console.log('📊 Connected to database for setup');
    
    // Create admin_users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "admin_users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "username" varchar(50) NOT NULL,
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "role" varchar(20) DEFAULT 'admin' NOT NULL,
        "first_name" varchar(100),
        "last_name" varchar(100),
        "is_active" boolean DEFAULT true NOT NULL,
        "last_login" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "admin_users_username_unique" UNIQUE("username"),
        CONSTRAINT "admin_users_email_unique" UNIQUE("email")
      );
    `);
    
    // Create admin_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "admin_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "admin_id" uuid NOT NULL,
        "token_hash" varchar(255) NOT NULL,
        "ip_address" varchar(45),
        "user_agent" text,
        "expires_at" timestamp NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "last_activity" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    // Create activity_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "activity_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "admin_id" uuid NOT NULL,
        "action" varchar(20) NOT NULL,
        "collection" varchar(50) NOT NULL,
        "document_id" varchar(255),
        "document_title" varchar(255),
        "ip_address" varchar(45),
        "user_agent" text,
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    // Add foreign key constraints
    try {
      await client.query(`
        ALTER TABLE "admin_sessions" 
        ADD CONSTRAINT "admin_sessions_admin_id_admin_users_id_fk" 
        FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") 
        ON DELETE cascade ON UPDATE no action;
      `);
    } catch (e) {
      // Constraint might already exist
    }
    
    try {
      await client.query(`
        ALTER TABLE "activity_logs" 
        ADD CONSTRAINT "activity_logs_admin_id_admin_users_id_fk" 
        FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") 
        ON DELETE cascade ON UPDATE no action;
      `);
    } catch (e) {
      // Constraint might already exist
    }
    
    console.log('✅ Database tables created');
    
    // Create super admin user with bcrypt hash
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash('SuperAdmin123!', 12);
    
    const result = await client.query(`
      INSERT INTO "admin_users" (
        "username", "email", "password_hash", "role", 
        "first_name", "last_name", "is_active"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (username) DO NOTHING
      RETURNING username;
    `, [
      'superadmin',
      'admin@vet-dict.com', 
      passwordHash,
      'super_admin',
      'Super',
      'Admin',
      true
    ]);
    
    if (result.rows.length > 0) {
      console.log('✅ Super admin created: superadmin');
    } else {
      console.log('✅ Super admin already exists');
    }
    
    await client.end();
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