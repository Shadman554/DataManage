// Simple standalone server for Railway - bypasses database setup entirely
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, '../dist/public')));

// Simple hardcoded authentication - no database needed
const ADMIN_CREDENTIALS = {
  username: 'superadmin',
  password: 'SuperAdmin123!',
  profile: {
    id: 'admin-1',
    username: 'superadmin',
    email: 'admin@vet-dict.com',
    role: 'super_admin',
    first_name: 'Super',
    last_name: 'Admin',
    is_active: true,
    created_at: new Date().toISOString()
  }
};

// Store active tokens (in production, use Redis or database)
const activeTokens = new Map();

// Login endpoint
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 Login attempt:', { username, hasPassword: !!password });
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      const token = 'token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      
      // Store token
      activeTokens.set(token, {
        admin: ADMIN_CREDENTIALS.profile,
        created: Date.now()
      });
      
      // Set cookie
      res.cookie('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      console.log('✅ Login successful for:', username);
      res.json({ admin: ADMIN_CREDENTIALS.profile });
    } else {
      console.log('❌ Invalid credentials for:', username);
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('🚨 Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Profile endpoint
app.get('/api/admin/profile', (req, res) => {
  try {
    const token = req.cookies.adminToken;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const session = activeTokens.get(token);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    // Check if token is expired (24 hours)
    if (Date.now() - session.created > 24 * 60 * 60 * 1000) {
      activeTokens.delete(token);
      return res.status(401).json({ error: 'Session expired' });
    }
    
    res.json({ admin: session.admin });
  } catch (error) {
    console.error('🚨 Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
app.post('/api/admin/logout', (req, res) => {
  try {
    const token = req.cookies.adminToken;
    
    if (token) {
      activeTokens.delete(token);
    }
    
    res.clearCookie('adminToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('🚨 Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Basic API endpoints for collections (return empty arrays for now)
const collections = ['books', 'words', 'diseases', 'drugs', 'tutorialVideos', 'staff', 'questions', 'notifications', 'users', 'normalRanges', 'appLinks'];

collections.forEach(collection => {
  app.get(`/api/collections/${collection}`, (req, res) => {
    res.json([]);
  });
  
  app.post(`/api/collections/${collection}`, (req, res) => {
    res.json({ id: Date.now().toString(), ...req.body });
  });
  
  app.put(`/api/collections/${collection}/:id`, (req, res) => {
    res.json({ id: req.params.id, ...req.body });
  });
  
  app.delete(`/api/collections/${collection}/:id`, (req, res) => {
    res.json({ success: true });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Simple server running on port', PORT);
  console.log('🔐 Admin credentials: superadmin / SuperAdmin123!');
  console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
  console.log('📁 Serving from:', path.join(__dirname, '../dist/public'));
});