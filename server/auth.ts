import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { adminUsers, adminSessions, activityLogs } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { AdminUser, InsertAdminUser, InsertActivityLog } from '@shared/schema';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const SALT_ROUNDS = 10;

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
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT token
  static generateToken(adminId: string): string {
    return jwt.sign(
      { adminId, type: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  // Verify JWT token
  static verifyToken(token: string): { adminId: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string };
      return decoded;
    } catch (error) {
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

  // Login admin
  static async login(username: string, password: string, req: Request): Promise<{ admin: AdminUser; token: string } | null> {
    let admin: AdminUser | null = null;
    
    // Use fallback storage if database is not available
    if (!db) {
      console.log("Using fallback admin storage");
      admin = fallbackAdmins.find(a => a.username === username && a.isActive) || null;
    } else {
      const [dbAdmin] = await db
        .select()
        .from(adminUsers)
        .where(and(
          eq(adminUsers.username, username),
          eq(adminUsers.isActive, true)
        ));
      admin = dbAdmin || null;
    }

    if (!admin || !(await this.verifyPassword(password, admin.password))) {
      return null;
    }

    // Update last login
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

    // Generate token
    const token = this.generateToken(admin.id);

    // Create session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    if (db) {
      await db
        .insert(adminSessions)
        .values({
          adminId: admin.id,
          sessionToken: token,
          expiresAt,
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
        });
    } else {
      // Store in fallback
      fallbackSessions.push(token);
    }

    return { admin: admin as AdminUser, token };
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

// Middleware to authenticate admin
export const authenticateAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.adminToken || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const admin = await AuthService.getAdminById(decoded.adminId);
    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
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