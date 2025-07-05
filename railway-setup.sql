-- Railway Database Setup Script
-- Run these commands in your PostgreSQL database

-- Create admin_users table
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

-- Create admin_sessions table
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

-- Create activity_logs table
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

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create super admin user
-- Password hash for 'SuperAdmin123!' using bcrypt
INSERT INTO "admin_users" (
    "username", 
    "email", 
    "password_hash", 
    "role", 
    "first_name", 
    "last_name",
    "is_active"
) VALUES (
    'superadmin',
    'admin@vet-dict.com',
    '$2b$12$LQv3c1yqBwEHxPuNQ6PhqOxvs8R8Y8WNrU7Rl.ZN.fHI6pFIvLjGy', -- SuperAdmin123!
    'super_admin',
    'Super',
    'Admin',
    true
) ON CONFLICT (username) DO NOTHING;

-- Verify the setup
SELECT 'Setup completed successfully!' as message;
SELECT username, email, role, created_at FROM admin_users WHERE username = 'superadmin';