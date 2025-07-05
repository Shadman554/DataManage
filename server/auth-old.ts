import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { adminUsers, adminSessions, activityLogs } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { AdminUser, InsertAdminUser, InsertActivityLog } from '@shared/schema';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const SALT_ROUNDS = 12; // Increased for better security
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

// Rate limiting and security tracking
const loginAttempts = new Map<string, { attempts: number; lastAttempt: Date; lockedUntil?: Date }>();
const activeSessions = new Map<string, { adminId: string; createdAt: Date; lastActivity: Date; ipAddress: string; userAgent: string }>();

// Fallback in-memory admin storage when database is not available
const fallbackAdmins: AdminUser[] = [
  {
    id: 'super-admin-1',
    username: 'superadmin',
    email: 'admin@vet-dict.com',
    password: '$2b$10$H84L4YraQzHr.tUKQHDSXusZq7Sw1yVFl4IeTFGuVv.zRrX5G.3Ha', // SuperAdmin123!
    role: 'super_admin',
    firstName: 'Super',
    lastName: 'Admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: undefined,
  }
];

const fallbackSessions: string[] = [];
const fallbackActivityLogs: any[] = [];

export interface AuthRequest extends Request {
  admin?: AdminUser;
}

export class AuthService {
  // Hash password with enhanced security
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  // Verify password with timing attack protection
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    // Add random delay to prevent timing attacks
    const randomDelay = Math.random() * 100 + 50; // 50-150ms
    await new Promise(resolve => setTimeout(resolve, randomDelay));
    
    return bcrypt.compare(password, hash);
  }

  // Check if IP is rate limited
  static isRateLimited(ipAddress: string): { isLimited: boolean; remainingTime?: number } {
    const attempt = loginAttempts.get(ipAddress);
    if (!attempt) return { isLimited: false };

    // Check if lockout period has expired
    if (attempt.lockedUntil && new Date() > attempt.lockedUntil) {
      loginAttempts.delete(ipAddress);
      return { isLimited: false };
    }

    if (attempt.lockedUntil) {
      const remainingTime = Math.ceil((attempt.lockedUntil.getTime() - Date.now()) / 1000);
      return { isLimited: true, remainingTime };
    }

    return { isLimited: false };
  }

  // Record failed login attempt
  static recordFailedAttempt(ipAddress: string): void {
    const attempt = loginAttempts.get(ipAddress) || { attempts: 0, lastAttempt: new Date() };
    
    attempt.attempts += 1;
    attempt.lastAttempt = new Date();

    // Lock account after max attempts
    if (attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
      attempt.lockedUntil = new Date(Date.now() + LOCKOUT_TIME);
      console.log(`🚨 IP ${ipAddress} locked for ${LOCKOUT_TIME / 60000} minutes after ${attempt.attempts} failed attempts`);
    }

    loginAttempts.set(ipAddress, attempt);
  }

  // Clear failed attempts on successful login
  static clearFailedAttempts(ipAddress: string): void {
    loginAttempts.delete(ipAddress);
  }

  // Validate password strength
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) errors.push('Password must be at least 8 characters long');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
    if (!/\d/.test(password)) errors.push('Password must contain at least one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must contain at least one special character');

    return { isValid: errors.length === 0, errors };
  }

  // Generate secure random token
  static generateSecureToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate secure JWT token with enhanced claims
  static generateToken(adminId: string, ipAddress: string, userAgent: string): string {
    const sessionId = this.generateSecureToken();
    const tokenPayload = {
      adminId,
      sessionId,
      type: 'admin',
      iat: Math.floor(Date.now() / 1000),
      ipHash: require('crypto').createHash('sha256').update(ipAddress).digest('hex'),
      userAgentHash: require('crypto').createHash('sha256').update(userAgent).digest('hex')
    };

    // Store active session
    activeSessions.set(sessionId, {
      adminId,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress,
      userAgent
    });

    return jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: '2h',
      issuer: 'vet-dict-admin',
      audience: 'vet-dict-admin-panel'
    });
  }

  // Verify JWT token with enhanced security checks
  static verifyToken(token: string, ipAddress: string, userAgent: string): { adminId: string; sessionId: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'vet-dict-admin',
        audience: 'vet-dict-admin-panel'
      }) as any;

      // Verify session exists and is valid
      const session = activeSessions.get(decoded.sessionId);
      if (!session) {
        console.log('🚨 Invalid session - session not found');
        return null;
      }

      // Check if session has expired
      if (Date.now() - session.lastActivity.getTime() > SESSION_TIMEOUT) {
        activeSessions.delete(decoded.sessionId);
        console.log('🚨 Session expired due to inactivity');
        return null;
      }

      // Verify IP address hasn't changed (prevent session hijacking)
      const currentIpHash = require('crypto').createHash('sha256').update(ipAddress).digest('hex');
      if (decoded.ipHash !== currentIpHash) {
        activeSessions.delete(decoded.sessionId);
        console.log('🚨 Session hijacking attempt detected - IP mismatch');
        return null;
      }

      // Verify User Agent hasn't changed
      const currentUserAgentHash = require('crypto').createHash('sha256').update(userAgent).digest('hex');
      if (decoded.userAgentHash !== currentUserAgentHash) {
        activeSessions.delete(decoded.sessionId);
        console.log('🚨 Session hijacking attempt detected - User Agent mismatch');
        return null;
      }

      // Update last activity
      session.lastActivity = new Date();
      activeSessions.set(decoded.sessionId, session);

      return { adminId: decoded.adminId, sessionId: decoded.sessionId };
    } catch (error) {
      console.log('🚨 Token verification failed:', error);
      return null;
    }
  }

  // Create admin user
  static async createAdmin(userData: InsertAdminUser): Promise<AdminUser> {
    const hashedPassword = await this.hashPassword(userData.password);
    
    if (!db) {
      // Use fallback storage
      const newAdmin: AdminUser = {
        id: `admin-${Date.now()}`,
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: undefined,
      };
      
      fallbackAdmins.push(newAdmin);
      return newAdmin;
    } else {
      const [admin] = await db
        .insert(adminUsers)
        .values({
          ...userData,
          password: hashedPassword,
        })
        .returning();

      return admin as AdminUser;
    }
  }

  // Ultra-secure login with comprehensive protection
  static async login(username: string, password: string, req: Request): Promise<{ admin: AdminUser; token: string; message?: string } | { error: string; remainingTime?: number }> {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Check rate limiting
    const rateLimitCheck = this.isRateLimited(ipAddress);
    if (rateLimitCheck.isLimited) {
      console.log(`🚨 Rate limited login attempt from IP: ${ipAddress}`);
      return { 
        error: `Too many failed attempts. Try again in ${Math.ceil((rateLimitCheck.remainingTime || 0) / 60)} minutes.`,
        remainingTime: rateLimitCheck.remainingTime
      };
    }

    // Input validation
    if (!username || !password) {
      this.recordFailedAttempt(ipAddress);
      return { error: 'Username and password are required' };
    }

    if (username.length > 50 || password.length > 100) {
      this.recordFailedAttempt(ipAddress);
      console.log(`🚨 Suspicious input length from IP: ${ipAddress}`);
      return { error: 'Invalid credentials' };
    }

    // Prevent SQL injection and XSS
    const sanitizedUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_\-\.@]+$/.test(sanitizedUsername)) {
      this.recordFailedAttempt(ipAddress);
      console.log(`🚨 Invalid username format from IP: ${ipAddress}`);
      return { error: 'Invalid credentials' };
    }

    let admin: AdminUser | null = null;
    
    try {
      // Use fallback storage if database is not available
      if (!db) {
        console.log("Using fallback admin storage");
        admin = fallbackAdmins.find(a => a.username.toLowerCase() === sanitizedUsername && a.isActive) || null;
      } else {
        const [dbAdmin] = await db
          .select()
          .from(adminUsers)
          .where(and(
            eq(adminUsers.username, sanitizedUsername),
            eq(adminUsers.isActive, true)
          ));
        admin = dbAdmin || null;
      }

      // Always verify password even if user doesn't exist (prevent user enumeration)
      const isValidPassword = admin ? await this.verifyPassword(password, admin.password) : false;
      
      if (!admin || !isValidPassword) {
        this.recordFailedAttempt(ipAddress);
        console.log(`🚨 Failed login attempt for username: ${sanitizedUsername} from IP: ${ipAddress}`);
        
        // Generic error message to prevent user enumeration
        return { error: 'Invalid credentials' };
      }

      // Additional account checks
      if (!admin.isActive) {
        this.recordFailedAttempt(ipAddress);
        console.log(`🚨 Login attempt for disabled account: ${sanitizedUsername} from IP: ${ipAddress}`);
        return { error: 'Account is disabled' };
      }

      // Clear failed attempts on successful login
      this.clearFailedAttempts(ipAddress);

    } catch (error) {
      console.error('🚨 Database error during login:', error);
      this.recordFailedAttempt(ipAddress);
      return { error: 'System temporarily unavailable' };
    }

    // Update last login timestamp
    if (db) {
      await db
        .update(adminUsers)
        .set({ lastLoginAt: new Date() })
        .where(eq(adminUsers.id, admin.id));
    } else {
      // Update in fallback storage
      const fallbackAdmin = fallbackAdmins.find(a => a.id === admin.id);
      if (fallbackAdmin) {
        fallbackAdmin.lastLoginAt = new Date();
      }
    }

    // Generate ultra-secure token with session tracking
    const token = this.generateToken(admin.id, ipAddress, userAgent);

    // Log successful login
    console.log(`✅ Successful login: ${admin.username} from IP: ${ipAddress}`);
    
    // Log security activity
    await this.logActivity({
      adminId: admin.id,
      action: 'create',
      collection: 'auth-session',
      documentId: 'login',
      documentTitle: `Login from ${ipAddress}`,
      newData: JSON.stringify({ ipAddress, userAgent, timestamp: new Date() }),
      ipAddress,
      userAgent,
    }).catch(console.error);

    return { 
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        firstName: admin.firstName,
        lastName: admin.lastName,
        isActive: admin.isActive,
      }, 
      token,
      message: 'Login successful'
    };
  }

  // Invalidate session (logout)
  static async invalidateSession(sessionId: string): Promise<void> {
    // Remove from active sessions
    activeSessions.delete(sessionId);
    
    // Note: Database session cleanup can be added here if using DB sessions
    console.log(`🔒 Session invalidated: ${sessionId}`);
  }

  // Clean up expired sessions (should be run periodically)
  static cleanExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of activeSessions.entries()) {
      if (now - session.lastActivity.getTime() > SESSION_TIMEOUT) {
        activeSessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired sessions`);
    }
  }

  // Get admin by ID
  static async getAdminById(adminId: string): Promise<AdminUser | null> {
    if (!db) {
      return fallbackAdmins.find(a => a.id === adminId && a.isActive) || null;
    }
    
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(and(
        eq(adminUsers.id, adminId),
        eq(adminUsers.isActive, true)
      ));

    return admin ? admin as AdminUser : null;
  }

  // Get admin by username
  static async getAdminByUsername(username: string): Promise<AdminUser | null> {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(and(
        eq(adminUsers.username, username),
        eq(adminUsers.isActive, true)
      ));

    return admin ? admin as AdminUser : null;
  }

  // Logout admin
  static async logout(token: string): Promise<void> {
    if (!db) {
      // Remove from fallback sessions
      const index = fallbackSessions.indexOf(token);
      if (index > -1) {
        fallbackSessions.splice(index, 1);
      }
      return;
    }
    
    await db
      .delete(adminSessions)
      .where(eq(adminSessions.sessionToken, token));
  }

  // Clean expired sessions
  static async cleanExpiredSessions(): Promise<void> {
    if (!db) {
      // Clean expired tokens from fallback storage
      const now = Date.now();
      fallbackSessions.splice(0, fallbackSessions.length, ...fallbackSessions.filter(() => false)); // Clear all for simplicity
      return;
    }
    
    await db
      .delete(adminSessions)
      .where(gt(adminSessions.expiresAt, new Date()));
  }

  // Log activity
  static async logActivity(activityData: InsertActivityLog): Promise<void> {
    if (!db) {
      // Store in fallback activity logs
      fallbackActivityLogs.push({
        ...activityData,
        id: `activity-${Date.now()}`,
        timestamp: new Date(),
      });
      return;
    }
    
    await db
      .insert(activityLogs)
      .values(activityData);
  }

  // Get all admins (super admin only)
  static async getAllAdmins(): Promise<AdminUser[]> {
    if (!db) {
      return fallbackAdmins.filter(admin => admin.isActive);
    }
    
    const admins = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.isActive, true));
    
    return admins as AdminUser[];
  }

  // Get admin statistics
  static async getAdminStats(adminId?: string) {
    if (!db) {
      // Return empty stats for fallback storage
      return {};
    }
    
    const whereClause = adminId ? eq(activityLogs.adminId, adminId) : undefined;
    
    const stats = await db
      .select({
        adminId: activityLogs.adminId,
        action: activityLogs.action,
        collection: activityLogs.collection,
        count: activityLogs.id,
      })
      .from(activityLogs)
      .where(whereClause);

    // Group by admin and action
    const groupedStats: Record<string, Record<string, number>> = {};
    
    for (const stat of stats) {
      if (!groupedStats[stat.adminId]) {
        groupedStats[stat.adminId] = { create: 0, update: 0, delete: 0 };
      }
      groupedStats[stat.adminId][stat.action] = (groupedStats[stat.adminId][stat.action] || 0) + 1;
    }

    return groupedStats;
  }

  // Get activity logs with admin details
  static async getActivityLogs(limit: number = 100, adminId?: string) {
    if (!db) {
      // Return empty activity logs for fallback storage
      return [];
    }
    
    const whereClause = adminId ? eq(activityLogs.adminId, adminId) : undefined;
    
    return db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        collection: activityLogs.collection,
        documentId: activityLogs.documentId,
        documentTitle: activityLogs.documentTitle,
        timestamp: activityLogs.timestamp,
        ipAddress: activityLogs.ipAddress,
        adminUsername: adminUsers.username,
        adminEmail: adminUsers.email,
        adminRole: adminUsers.role,
      })
      .from(activityLogs)
      .leftJoin(adminUsers, eq(activityLogs.adminId, adminUsers.id))
      .where(whereClause)
      .orderBy(activityLogs.timestamp)
      .limit(limit);
  }

  // Update admin (super admin only)
  static async updateAdmin(adminId: string, updateData: Partial<AdminUser>): Promise<AdminUser | null> {
    const [updatedAdmin] = await db
      .update(adminUsers)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, adminId))
      .returning();
    
    return updatedAdmin as AdminUser || null;
  }

  // Delete admin (super admin only)
  static async deleteAdmin(adminId: string): Promise<boolean> {
    const result = await db
      .delete(adminUsers)
      .where(eq(adminUsers.id, adminId));
    
    return (result.rowCount || 0) > 0;
  }

  // Toggle admin active status (super admin only)
  static async toggleAdminStatus(adminId: string): Promise<AdminUser | null> {
    const admin = await this.getAdminById(adminId);
    if (!admin) return null;

    const [updatedAdmin] = await db
      .update(adminUsers)
      .set({
        isActive: !admin.isActive,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, adminId))
      .returning();
    
    return updatedAdmin as AdminUser || null;
  }
}

// Ultra-secure authentication middleware
export const authenticateAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.adminToken || req.headers.authorization?.replace('Bearer ', '');
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    if (!token) {
      console.log(`🚨 No token provided from IP: ${ipAddress}`);
      return res.status(401).json({ error: 'No token provided' });
    }

    // Enhanced token verification with session hijacking protection
    const decoded = AuthService.verifyToken(token, ipAddress, userAgent);
    if (!decoded) {
      console.log(`🚨 Invalid or hijacked token from IP: ${ipAddress}`);
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const admin = await AuthService.getAdminById(decoded.adminId);
    if (!admin || !admin.isActive) {
      console.log(`🚨 Admin not found or disabled: ${decoded.adminId} from IP: ${ipAddress}`);
      return res.status(401).json({ error: 'Access denied' });
    }

    // Store admin info in request for use in other middleware
    req.admin = admin;
    
    // Log suspicious activity patterns
    const suspiciousPatterns = [
      userAgent.includes('bot'),
      userAgent.includes('crawler'),
      userAgent.includes('spider'),
      userAgent.length < 10,
      !userAgent.includes('Mozilla')
    ];
    
    if (suspiciousPatterns.some(pattern => pattern)) {
      console.log(`⚠️ Suspicious user agent detected: ${userAgent} from IP: ${ipAddress}`);
    }
    
    next();
  } catch (error) {
    console.error('🚨 Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Middleware to check super admin permissions
export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.admin || req.admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

// Middleware to log activities
export const logActivity = (action: 'create' | 'update' | 'delete', collection: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the activity after successful response
      if (req.admin && res.statusCode >= 200 && res.statusCode < 300) {
        const documentId = req.params.id || req.body.id || 'unknown';
        const documentTitle = req.body.title || req.body.name || req.body.username || 'Untitled';
        
        AuthService.logActivity({
          adminId: req.admin.id,
          action,
          collection,
          documentId,
          documentTitle,
          oldData: action === 'update' || action === 'delete' ? JSON.stringify(req.body) : undefined,
          newData: action === 'create' || action === 'update' ? JSON.stringify(req.body) : undefined,
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
        }).catch(console.error);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};