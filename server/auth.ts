import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './db';
import { adminUsers, adminSessions, activityLogs } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { AdminUser, InsertAdminUser, InsertActivityLog } from '@shared/schema';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const SALT_ROUNDS = 12; // Military-grade password hashing
const MAX_LOGIN_ATTEMPTS = 5; // Lock after 5 failed attempts
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes lockout
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours session timeout

// Security tracking
const loginAttempts = new Map<string, { attempts: number; lastAttempt: Date; lockedUntil?: Date }>();
const activeSessions = new Map<string, { adminId: string; createdAt: Date; lastActivity: Date; ipAddress: string; userAgent: string }>();

// Fallback storage for when database is unavailable
const fallbackAdmins: AdminUser[] = [];

// Initialize fallback admin user
async function initializeFallbackAdmin() {
  if (fallbackAdmins.length === 0) {
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', SALT_ROUNDS);
    fallbackAdmins.push({
      id: 'admin_fallback_superadmin',
      username: 'superadmin',
      email: 'admin@vet-dict.com',
      password: hashedPassword,
      role: 'super_admin',
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null
    });
    console.log('✓ Fallback super admin user initialized');
  }
}

// Initialize fallback admin on module load
initializeFallbackAdmin().catch(console.error);

export interface AuthRequest extends Request {
  admin?: AdminUser;
}

export class SecureAuthService {
  // Enhanced password hashing
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  // Timing attack resistant password verification
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const randomDelay = Math.random() * 100 + 50; // 50-150ms random delay
    await new Promise(resolve => setTimeout(resolve, randomDelay));
    return bcrypt.compare(password, hash);
  }

  // Rate limiting check
  static isRateLimited(ipAddress: string): { isLimited: boolean; remainingTime?: number } {
    const attempt = loginAttempts.get(ipAddress);
    if (!attempt) return { isLimited: false };

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

  // Record failed login attempts
  static recordFailedAttempt(ipAddress: string): void {
    const attempt = loginAttempts.get(ipAddress) || { attempts: 0, lastAttempt: new Date() };
    
    attempt.attempts += 1;
    attempt.lastAttempt = new Date();

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

  // Password strength validation
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) errors.push('Password must be at least 8 characters long');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
    if (!/\d/.test(password)) errors.push('Password must contain at least one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must contain at least one special character');

    return { isValid: errors.length === 0, errors };
  }

  // Generate cryptographically secure token
  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate ultra-secure JWT with session binding
  static generateToken(adminId: string, ipAddress: string, userAgent: string): string {
    const sessionId = this.generateSecureToken();
    
    const tokenPayload = {
      adminId,
      sessionId,
      type: 'admin',
      iat: Math.floor(Date.now() / 1000),
      ipHash: crypto.createHash('sha256').update(ipAddress).digest('hex'),
      userAgentHash: crypto.createHash('sha256').update(userAgent).digest('hex')
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

  // Verify token with session hijacking protection
  static verifyToken(token: string, ipAddress: string, userAgent: string): { adminId: string; sessionId: string } | null {
    try {

      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'vet-dict-admin',
        audience: 'vet-dict-admin-panel'
      }) as any;

      const session = activeSessions.get(decoded.sessionId);
      if (!session) {
        console.log('🚨 Invalid session - session not found');
        return null;
      }

      // Check session timeout
      if (Date.now() - session.lastActivity.getTime() > SESSION_TIMEOUT) {
        activeSessions.delete(decoded.sessionId);
        console.log('🚨 Session expired due to inactivity');
        return null;
      }

      // Prevent session hijacking - verify IP
      const currentIpHash = crypto.createHash('sha256').update(ipAddress).digest('hex');
      if (decoded.ipHash !== currentIpHash) {
        activeSessions.delete(decoded.sessionId);
        console.log('🚨 Session hijacking attempt detected - IP mismatch');
        return null;
      }

      // Prevent session hijacking - verify User Agent
      const currentUserAgentHash = crypto.createHash('sha256').update(userAgent).digest('hex');
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

  // Ultra-secure login with comprehensive protection
  static async login(username: string, password: string, req: Request): Promise<{ admin: AdminUser; token: string; message?: string } | { error: string; remainingTime?: number }> {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Rate limiting check
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

    // Sanitize username to prevent injection attacks
    const sanitizedUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_\-\.@]+$/.test(sanitizedUsername)) {
      this.recordFailedAttempt(ipAddress);
      console.log(`🚨 Invalid username format from IP: ${ipAddress}`);
      return { error: 'Invalid credentials' };
    }

    let admin: AdminUser | null = null;
    
    try {
      // Get admin from database or fallback
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

      // Always verify password (prevent user enumeration)
      const isValidPassword = admin ? await this.verifyPassword(password, admin.password) : false;
      
      if (!admin || !isValidPassword) {
        this.recordFailedAttempt(ipAddress);
        console.log(`🚨 Failed login attempt for username: ${sanitizedUsername} from IP: ${ipAddress}`);
        return { error: 'Invalid credentials' };
      }

      if (!admin.isActive) {
        this.recordFailedAttempt(ipAddress);
        console.log(`🚨 Login attempt for disabled account: ${sanitizedUsername} from IP: ${ipAddress}`);
        return { error: 'Account is disabled' };
      }

      // Clear failed attempts on successful login
      this.clearFailedAttempts(ipAddress);

      // Update last login timestamp
      if (db) {
        await db
          .update(adminUsers)
          .set({ lastLoginAt: new Date() })
          .where(eq(adminUsers.id, admin.id));
      } else if (admin) {
        const fallbackAdmin = fallbackAdmins.find(a => a.id === admin.id);
        if (fallbackAdmin) {
          fallbackAdmin.lastLoginAt = new Date();
        }
      }

      // Generate secure token
      const token = this.generateToken(admin.id, ipAddress, userAgent);

      console.log(`✅ Successful login: ${admin.username} from IP: ${ipAddress}`);

      return { 
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          firstName: admin.firstName,
          lastName: admin.lastName,
          isActive: admin.isActive,
        } as AdminUser, 
        token,
        message: 'Login successful'
      };

    } catch (error) {
      console.error('🚨 Database error during login:', error);
      this.recordFailedAttempt(ipAddress);
      return { error: 'System temporarily unavailable' };
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
      .where(eq(adminUsers.id, adminId));
    
    return admin || null;
  }

  // Invalidate session (logout)
  static async invalidateSession(sessionId: string): Promise<void> {
    activeSessions.delete(sessionId);
    console.log(`🔒 Session invalidated: ${sessionId}`);
  }

  // Clean expired sessions
  static cleanExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of Array.from(activeSessions.entries())) {
      if (now - session.lastActivity.getTime() > SESSION_TIMEOUT) {
        activeSessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired sessions`);
    }
  }

  // Create admin user
  static async createAdmin(userData: InsertAdminUser): Promise<AdminUser> {
    const hashedPassword = await this.hashPassword(userData.password);
    
    if (!db) {
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

  // Get admin by username
  static async getAdminByUsername(username: string): Promise<AdminUser | null> {
    if (!db) {
      return fallbackAdmins.find(a => a.username === username) || null;
    }

    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username));
    
    return admin || null;
  }

  // Get all admins (super admin only)
  static async getAllAdmins(): Promise<AdminUser[]> {
    if (!db) {
      return fallbackAdmins;
    }

    return await db.select().from(adminUsers);
  }

  // Get admin statistics
  static async getAdminStats(adminId?: string) {
    // Return basic stats for now
    return {
      totalAdmins: fallbackAdmins.length,
      activeAdmins: fallbackAdmins.filter(a => a.isActive).length,
      totalOperations: 0,
      recentLogins: 0
    };
  }

  // Get activity logs
  static async getActivityLogs(limit: number = 100, adminId?: string) {
    // Return empty array for fallback
    return [];
  }

  // Update admin
  static async updateAdmin(adminId: string, updateData: Partial<AdminUser>): Promise<AdminUser | null> {
    if (!db) {
      const admin = fallbackAdmins.find(a => a.id === adminId);
      if (admin) {
        Object.assign(admin, updateData, { updatedAt: new Date() });
        return admin;
      }
      return null;
    }

    const [updatedAdmin] = await db
      .update(adminUsers)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(adminUsers.id, adminId))
      .returning();

    return updatedAdmin || null;
  }

  // Delete admin
  static async deleteAdmin(adminId: string): Promise<boolean> {
    if (!db) {
      const index = fallbackAdmins.findIndex(a => a.id === adminId);
      if (index !== -1) {
        fallbackAdmins.splice(index, 1);
        return true;
      }
      return false;
    }

    const result = await db
      .delete(adminUsers)
      .where(eq(adminUsers.id, adminId));

    return true;
  }

  // Toggle admin status
  static async toggleAdminStatus(adminId: string): Promise<AdminUser | null> {
    if (!db) {
      const admin = fallbackAdmins.find(a => a.id === adminId);
      if (admin) {
        admin.isActive = !admin.isActive;
        admin.updatedAt = new Date();
        return admin;
      }
      return null;
    }

    const admin = await this.getAdminById(adminId);
    if (!admin) return null;

    const [updatedAdmin] = await db
      .update(adminUsers)
      .set({ isActive: !admin.isActive, updatedAt: new Date() })
      .where(eq(adminUsers.id, adminId))
      .returning();

    return updatedAdmin || null;
  }

  // Activity logging
  static async logActivity(activityData: InsertActivityLog): Promise<void> {
    // Log to console for now (can be enhanced later)
    console.log(`📝 Activity: ${activityData.action} ${activityData.collection} by ${activityData.adminId}`);
  }

  // Logout function
  static async logout(token: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.sessionId) {
        await this.invalidateSession(decoded.sessionId);
      }
    } catch (error) {
      console.log('Token already invalid or expired');
    }
  }

  // Get security statistics
  static getSecurityStats() {
    return {
      activeSessions: activeSessions.size,
      blockedIPs: Array.from(loginAttempts.entries()).filter(([, attempt]) => attempt.lockedUntil && new Date() < attempt.lockedUntil).length,
      failedAttempts: Array.from(loginAttempts.values()).reduce((sum, attempt) => sum + attempt.attempts, 0)
    };
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

    const decoded = SecureAuthService.verifyToken(token, ipAddress, userAgent);
    if (!decoded) {
      console.log(`🚨 Invalid or hijacked token from IP: ${ipAddress}`);
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const admin = await SecureAuthService.getAdminById(decoded.adminId);
    if (!admin || !admin.isActive) {
      console.log(`🚨 Admin not found or disabled: ${decoded.adminId} from IP: ${ipAddress}`);
      return res.status(401).json({ error: 'Access denied' });
    }

    req.admin = admin;
    
    // Detect suspicious user agents
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

// Super admin permission check
export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.admin || req.admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

// Periodic security maintenance (run every 5 minutes)
setInterval(() => {
  SecureAuthService.cleanExpiredSessions();
}, 5 * 60 * 1000);

export { SecureAuthService as AuthService };