import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { storage as firebaseStorage } from "./firebase";
import { 
  insertBookSchema, insertWordSchema, insertDiseaseSchema, insertDrugSchema,
  insertTutorialVideoSchema, insertStaffSchema, insertQuestionSchema,
  insertNotificationSchema, insertUserSchema, insertNormalRangeSchema,
  insertAppLinkSchema, type CollectionName
} from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
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
      const bucket = firebaseStorage.bucket();
      const fileRef = bucket.file(fileName);

      const stream = fileRef.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      stream.on('error', (error) => {
        console.error('Upload error:', error);
        res.status(500).json({ error: "Failed to upload file" });
      });

      stream.on('finish', async () => {
        try {
          await fileRef.makePublic();
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          res.json({ url: publicUrl });
        } catch (error) {
          console.error('Error making file public:', error);
          res.status(500).json({ error: "Failed to make file public" });
        }
      });

      stream.end(file.buffer);
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
