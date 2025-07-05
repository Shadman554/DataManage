-- Railway Database Setup
-- Create admin tables for Railway deployment

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    "fullName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    action TEXT NOT NULL,
    collection TEXT NOT NULL,
    "documentId" TEXT,
    "documentTitle" TEXT,
    "beforeData" TEXT,
    "afterData" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT
);

-- Insert super admin (only if not exists)
INSERT INTO admin_users (id, username, email, password, role, "fullName", "isActive", "createdAt", "updatedAt")
SELECT 
    'super-admin-001',
    'superadmin',
    'admin@vet-dict.com',
    '$2b$12$LQv3c1yqBwEHFSjHqg8XjuLpP6bWLhxoKGJcqOL3fEQRXgzgJxzfO', -- SuperAdmin123!
    'super_admin',
    'Super Administrator',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE username = 'superadmin');