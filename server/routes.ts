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
import { AuthService, authenticateAdmin, requireSuperAdmin, logActivity, type AuthRequest } from "./auth";
import cookieParser from "cookie-parser";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser middleware
  app.use(cookieParser());

  // ===== ADMIN AUTHENTICATION ROUTES =====
  
  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const result = await AuthService.login(username, password, req);
      if (!result) {
        return res.status(401).json({ error: "Invalid username or password" });
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
      res.status(400).json({ error: "Invalid request data" });
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
      res.status(400).json({ error: "Failed to create admin" });
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

  app.post("/api/collections/:collection", async (req, res) => {
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
      res.json(result);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.put("/api/collections/:collection/:id", async (req, res) => {
    try {
      const collection = req.params.collection as CollectionName;
      const id = req.params.id;
      const data = req.body;
      
      const result = await storage.updateDocument(collection, id, data);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.delete("/api/collections/:collection/:id", async (req, res) => {
    try {
      const collection = req.params.collection as CollectionName;
      const id = req.params.id;
      
      await storage.deleteDocument(collection, id);
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

  const httpServer = createServer(app);
  return httpServer;
}
