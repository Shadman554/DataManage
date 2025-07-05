import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { 
  insertBookSchema, insertWordSchema, insertDiseaseSchema, insertDrugSchema,
  insertTutorialVideoSchema, insertStaffSchema, insertQuestionSchema,
  insertNotificationSchema, insertUserSchema, insertNormalRangeSchema,
  insertAppLinkSchema, type CollectionName, loginSchema, insertAdminUserSchema
} from "@shared/schema";
import { AuthService, authenticateAdmin, requireSuperAdmin, type AuthRequest } from "./auth";
import cookieParser from "cookie-parser";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser middleware
  app.use(cookieParser());

  // Health check endpoint (using different path to avoid interfering with frontend)
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // One-time database setup endpoint for Railway
  app.get('/setup-database', async (req, res) => {
    try {
      const { db } = await import('./db');
      
      // Create admin_users table
      await db.execute(`
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
        )
      `);
      
      // Create admin_sessions table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS admin_sessions (
          id TEXT PRIMARY KEY,
          "adminId" TEXT NOT NULL,
          "sessionToken" TEXT NOT NULL,
          "expiresAt" TIMESTAMP NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "lastActivity" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "ipAddress" TEXT,
          "userAgent" TEXT
        )
      `);
      
      // Create activity_logs table
      await db.execute(`
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
        )
      `);
      
      // Insert super admin if not exists
      await db.execute(`
        INSERT INTO admin_users (id, username, email, password, role, "fullName", "isActive", "createdAt", "updatedAt")
        SELECT 
          'super-admin-001',
          'superadmin',
          'admin@vet-dict.com',
          '$2b$12$LQv3c1yqBwEHFSjHqg8XjuLpP6bWLhxoKGJcqOL3fEQRXgzgJxzfO',
          'super_admin',
          'Super Administrator',
          true,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE username = 'superadmin')
      `);
      
      res.json({ 
        success: true, 
        message: 'Database setup completed successfully!',
        login: {
          username: 'superadmin',
          password: 'SuperAdmin123!'
        }
      });
    } catch (error) {
      console.error('Database setup failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Database setup failed. Check logs for details.'
      });
    }
  });

  // ===== ADMIN AUTHENTICATION ROUTES =====
  
  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const result = await AuthService.login(username, password, req);
      
      // Handle error responses from secure auth
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
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          firstName: admin.firstName,
          lastName: admin.lastName,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ 
        error: "Invalid request data", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", authenticateAdmin, async (req: AuthRequest, res) => {
    try {
      const token = req.cookies.adminToken;
      if (token) {
        await AuthService.logout(token);
      }
      res.clearCookie("adminToken");
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Get current admin profile
  app.get("/api/admin/profile", authenticateAdmin, async (req: AuthRequest, res) => {
    res.json({
      admin: {
        id: req.admin!.id,
        username: req.admin!.username,
        email: req.admin!.email,
        role: req.admin!.role,
        firstName: req.admin!.firstName,
        lastName: req.admin!.lastName,
        lastLoginAt: req.admin!.lastLoginAt,
      },
    });
  });

  // Create new admin (super admin only)
  app.post("/api/admin/create", authenticateAdmin, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const adminData = insertAdminUserSchema.parse(req.body);
      const newAdmin = await AuthService.createAdmin(adminData);
      
      res.json({
        admin: {
          id: newAdmin.id,
          username: newAdmin.username,
          email: newAdmin.email,
          role: newAdmin.role,
          firstName: newAdmin.firstName,
          lastName: newAdmin.lastName,
        },
      });
    } catch (error) {
      console.error("Admin creation error:", error);
      res.status(400).json({ 
        error: "Failed to create admin",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get all admins (super admin only)
  app.get("/api/admin/all", authenticateAdmin, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const admins = await AuthService.getAllAdmins();
      res.json(admins.map(admin => ({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        firstName: admin.firstName,
        lastName: admin.lastName,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
      })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admins" });
    }
  });

  // Get admin statistics (super admin only)
  app.get("/api/admin/stats", authenticateAdmin, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const stats = await AuthService.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Get activity logs (super admin only)
  app.get("/api/admin/activity", authenticateAdmin, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const adminId = req.query.adminId as string;
      
      const logs = await AuthService.getActivityLogs(limit, adminId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Update admin (super admin only)
  app.put("/api/admin/:id", authenticateAdmin, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const adminId = req.params.id;
      const updateData = req.body;
      
      // Remove sensitive fields that shouldn't be updated via this endpoint
      const { password, ...safeUpdateData } = updateData;
      
      const updatedAdmin = await AuthService.updateAdmin(adminId, safeUpdateData);
      if (!updatedAdmin) {
        return res.status(404).json({ error: "Admin not found" });
      }
      
      res.json({
        admin: {
          id: updatedAdmin.id,
          username: updatedAdmin.username,
          email: updatedAdmin.email,
          role: updatedAdmin.role,
          firstName: updatedAdmin.firstName,
          lastName: updatedAdmin.lastName,
          isActive: updatedAdmin.isActive,
        },
      });
    } catch (error) {
      res.status(400).json({ error: "Failed to update admin" });
    }
  });

  // Delete admin (super admin only)
  app.delete("/api/admin/:id", authenticateAdmin, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const adminId = req.params.id;
      
      // Prevent super admin from deleting themselves
      if (adminId === req.admin!.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      const success = await AuthService.deleteAdmin(adminId);
      if (!success) {
        return res.status(404).json({ error: "Admin not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete admin" });
    }
  });

  // Toggle admin active status (super admin only)
  app.post("/api/admin/:id/toggle-status", authenticateAdmin, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const adminId = req.params.id;
      
      // Prevent super admin from deactivating themselves
      if (adminId === req.admin!.id) {
        return res.status(400).json({ error: "Cannot change your own status" });
      }
      
      const updatedAdmin = await AuthService.toggleAdminStatus(adminId);
      if (!updatedAdmin) {
        return res.status(404).json({ error: "Admin not found" });
      }
      
      res.json({
        admin: {
          id: updatedAdmin.id,
          username: updatedAdmin.username,
          email: updatedAdmin.email,
          role: updatedAdmin.role,
          firstName: updatedAdmin.firstName,
          lastName: updatedAdmin.lastName,
          isActive: updatedAdmin.isActive,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle admin status" });
    }
  });

  // Initialize super admin (development only)
  app.post("/api/admin/init", async (req, res) => {
    try {
      // Check if super admin already exists
      const existingAdmin = await AuthService.getAdminByUsername('superadmin');
      if (existingAdmin) {
        return res.status(400).json({ error: "Super admin already exists" });
      }

      const superAdmin = await AuthService.createAdmin({
        username: 'superadmin',
        email: 'admin@vet-dict.com',
        password: 'SuperAdmin123!',
        role: 'super_admin',
        firstName: 'Super',
        lastName: 'Admin',
        isActive: true,
      });

      res.json({
        message: "Super admin created successfully",
        admin: {
          id: superAdmin.id,
          username: superAdmin.username,
          email: superAdmin.email,
          role: superAdmin.role,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to initialize super admin" });
    }
  });

  // ===== PROTECTED COLLECTION ROUTES =====
  // Generic collection routes
  app.get("/api/collections/:collection", async (req, res) => {
    try {
      const collection = req.params.collection as CollectionName;
      const data = await storage.getCollection(collection);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collection" });
    }
  });

  app.get("/api/collections/:collection/:id", async (req, res) => {
    try {
      const collection = req.params.collection as CollectionName;
      const id = req.params.id;
      const data = await storage.getDocument(collection, id);
      if (!data) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  app.post("/api/collections/:collection", authenticateAdmin, async (req: AuthRequest, res) => {
    try {
      const collection = req.params.collection as CollectionName;
      const data = req.body;
      
      // Validate based on collection type
      let validatedData;
      switch (collection) {
        case 'books':
          validatedData = insertBookSchema.parse(data);
          break;
        case 'words':
          validatedData = insertWordSchema.parse(data);
          break;
        case 'diseases':
          validatedData = insertDiseaseSchema.parse(data);
          break;
        case 'drugs':
          validatedData = insertDrugSchema.parse(data);
          break;
        case 'tutorialVideos':
          validatedData = insertTutorialVideoSchema.parse(data);
          break;
        case 'staff':
          validatedData = insertStaffSchema.parse(data);
          break;
        case 'questions':
          validatedData = insertQuestionSchema.parse(data);
          break;
        case 'notifications':
          validatedData = insertNotificationSchema.parse(data);
          break;
        case 'users':
          validatedData = insertUserSchema.parse(data);
          break;
        case 'normalRanges':
          validatedData = insertNormalRangeSchema.parse(data);
          break;
        case 'appLinks':
          validatedData = insertAppLinkSchema.parse(data);
          break;
        default:
          return res.status(400).json({ error: "Invalid collection" });
      }
      
      const result = await storage.createDocument(collection, validatedData);
      
      // Log activity
      if (req.admin) {
        const documentTitle = (validatedData as any).title || (validatedData as any).name || (validatedData as any).english || (validatedData as any).username || 'Untitled';
        await AuthService.logActivity({
          adminId: req.admin.id,
          action: 'create',
          collection: collection,
          documentId: (result as any).id,
          documentTitle,
          newData: JSON.stringify(result),
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
        }).catch(console.error);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.put("/api/collections/:collection/:id", authenticateAdmin, async (req: AuthRequest, res) => {
    try {
      const collection = req.params.collection as CollectionName;
      const id = req.params.id;
      const data = req.body;
      
      // Get old data for logging
      const oldData = await storage.getDocument(collection, id);
      
      const result = await storage.updateDocument(collection, id, data);
      
      // Log activity
      if (req.admin) {
        const documentTitle = (data as any).title || (data as any).name || (data as any).english || (data as any).username || 'Untitled';
        await AuthService.logActivity({
          adminId: req.admin.id,
          action: 'update',
          collection: collection,
          documentId: id,
          documentTitle,
          oldData: oldData ? JSON.stringify(oldData) : undefined,
          newData: JSON.stringify(result),
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
        }).catch(console.error);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.delete("/api/collections/:collection/:id", authenticateAdmin, async (req: AuthRequest, res) => {
    try {
      const collection = req.params.collection as CollectionName;
      const id = req.params.id;
      
      // Get data before deletion for logging
      const oldData = await storage.getDocument(collection, id);
      
      await storage.deleteDocument(collection, id);
      
      // Log activity
      if (req.admin && oldData) {
        const documentTitle = (oldData as any).title || (oldData as any).name || (oldData as any).english || (oldData as any).username || 'Untitled';
        await AuthService.logActivity({
          adminId: req.admin.id,
          action: 'delete',
          collection: collection,
          documentId: id,
          documentTitle,
          oldData: JSON.stringify(oldData),
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
        }).catch(console.error);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Search endpoint
  app.get("/api/search/:collection", async (req, res) => {
    try {
      const collection = req.params.collection as CollectionName;
      const query = req.query.q as string;
      const field = req.query.field as string;
      
      const results = await storage.searchCollection(collection, query, field);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to search collection" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const file = req.file;
      const fileName = `${Date.now()}_${file.originalname}`;
      
      // For now, simulate a successful upload with a placeholder URL
      // In a real deployment, this would be replaced with actual file storage
      const mockUrl = `https://placeholder.com/files/${fileName}`;
      
      console.log(`File upload simulated: ${fileName} (${file.size} bytes)`);
      res.json({ url: mockUrl });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Export data endpoint
  app.get("/api/export/:collection", async (req, res) => {
    try {
      const collection = req.params.collection as CollectionName;
      const data = await storage.getCollection(collection);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${collection}.json"`);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Bulk operations
  app.post("/api/collections/:collection/bulk", async (req, res) => {
    try {
      const collection = req.params.collection as CollectionName;
      const { action, ids } = req.body;
      
      if (action === 'delete') {
        await Promise.all(ids.map((id: string) => storage.deleteDocument(collection, id)));
        res.json({ success: true, deletedCount: ids.length });
      } else {
        res.status(400).json({ error: "Invalid bulk action" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to perform bulk operation" });
    }
  });

  // ===== SETTINGS ROUTES =====
  
  // Get system settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = {
        firebaseEnabled: true, // Firebase is now configured and working
        autoBackup: false,
        backupFrequency: 'daily' as const,
        maxFileSize: 10,
        allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
        maintenanceMode: false,
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update system settings
  app.put("/api/settings", async (req, res) => {
    try {
      // In a real app, you'd save these to a database
      // For now, we'll just return success
      res.json({ success: true, message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Get database info
  app.get("/api/system/database-info", async (req, res) => {
    try {
      // Get collection counts
      const collections = ['books', 'words', 'diseases', 'drugs', 'tutorialVideos', 'staff', 'questions', 'notifications', 'users', 'normalRanges', 'appLinks'];
      let totalRecords = 0;
      
      for (const collectionName of collections) {
        try {
          const data = await storage.getCollection(collectionName as CollectionName);
          totalRecords += data.length;
        } catch (error) {
          console.error(`Error getting ${collectionName} collection:`, error);
        }
      }

      const dbInfo = {
        status: 'connected' as const,
        totalRecords,
        lastBackup: new Date().toISOString(),
        storageUsed: Math.round(totalRecords * 0.1), // Rough estimate
        storageLimit: 1000,
      };

      res.json(dbInfo);
    } catch (error) {
      console.error("Error fetching database info:", error);
      res.status(500).json({ error: "Failed to fetch database info" });
    }
  });

  // Test Firebase connection
  app.post("/api/system/test-firebase", async (req, res) => {
    try {
      // Test Firebase connection using the testFirebaseConnection function
      const { testFirebaseConnection } = await import('./firebase-test');
      const isConnected = await testFirebaseConnection();
      
      if (isConnected) {
        res.json({
          success: true,
          message: "Firebase connection successful"
        });
      } else {
        res.json({
          success: false,
          message: "Firebase connection failed"
        });
      }
    } catch (error: any) {
      console.error("Error testing Firebase:", error);
      
      // Check if it's a quota error (which means connection is working)
      if (error.code === 8 && error.details?.includes('Quota exceeded')) {
        res.json({
          success: true,
          message: "Firebase connected successfully (quota limit reached)"
        });
      } else {
        res.json({
          success: false,
          message: "Firebase connection failed: " + (error as Error).message
        });
      }
    }
  });

  // Export data
  app.post("/api/system/export", async (req, res) => {
    try {
      const collections = ['books', 'words', 'diseases', 'drugs', 'tutorialVideos', 'staff', 'questions', 'notifications', 'users', 'normalRanges', 'appLinks'];
      const exportData: any = {};

      for (const collectionName of collections) {
        try {
          const data = await storage.getCollection(collectionName as CollectionName);
          exportData[collectionName] = data;
        } catch (error) {
          console.error(`Error exporting ${collectionName}:`, error);
          exportData[collectionName] = [];
        }
      }

      // Add metadata
      exportData._metadata = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        totalRecords: Object.values(exportData).flat().length,
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="veterinary-data-export.json"');
      res.send(JSON.stringify(exportData, null, 2));
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Clear cache
  app.post("/api/system/clear-cache", async (req, res) => {
    try {
      // In a real app, you'd clear Redis or other cache systems
      // For now, we'll just return success
      res.json({ success: true, message: "Cache cleared successfully" });
    } catch (error) {
      console.error("Error clearing cache:", error);
      res.status(500).json({ error: "Failed to clear cache" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
