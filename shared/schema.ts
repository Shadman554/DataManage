import { z } from "zod";
import { pgTable, text, varchar, timestamp, boolean, integer, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Base timestamp schema
export const timestampSchema = z.object({
  _seconds: z.number(),
  _nanoseconds: z.number(),
});

// Book schema
export const bookSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  coverImageUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  _exportedAt: z.string(),
});

// Word schema
export const wordSchema = z.object({
  id: z.string(),
  name: z.string(),
  kurdish: z.string(),
  arabic: z.string(),
  description: z.string(),
  barcode: z.string().nullable(),
  isSaved: z.boolean(),
  isFavorite: z.boolean(),
  _exportedAt: z.string(),
});

// Disease schema
export const diseaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  kurdish: z.string(),
  symptoms: z.string(),
  cause: z.string(),
  control: z.string(),
  _exportedAt: z.string(),
});

// Drug schema
export const drugSchema = z.object({
  id: z.string(),
  name: z.string(),
  usage: z.string(),
  sideEffect: z.string(),
  otherInfo: z.string(),
  class: z.string().optional(),
  createdAt: z.object({
    _seconds: z.number(),
    _nanoseconds: z.number(),
  }).optional(),
  _exportedAt: z.string(),
});

// Tutorial Video schema
export const tutorialVideoSchema = z.object({
  id: z.string(),
  Title: z.string(),
  VideoID: z.string(),
  _exportedAt: z.string(),
});

// Staff schema
export const staffSchema = z.object({
  id: z.string(),
  name: z.string(),
  job: z.string(),
  description: z.string(),
  photo: z.string(),
  facebook: z.string(),
  instagram: z.string(),
  snapchat: z.string(),
  twitter: z.string(),
  _exportedAt: z.string(),
});

// Question schema
export const questionSchema = z.object({
  id: z.string(),
  text: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  userPhoto: z.string(),
  userId: z.string(),
  likes: z.number(),
  timestamp: timestampSchema,
  _exportedAt: z.string(),
});

// Notification schema
export const notificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  imageUrl: z.string().optional(),
  timestamp: timestampSchema,
  _exportedAt: z.string(),
});

// User schema
export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  today_points: z.number(),
  total_points: z.number(),
  last_updated: timestampSchema,
  _exportedAt: z.string(),
});

// Normal Range schema
export const normalRangeSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  minValue: z.string(),
  maxValue: z.string(),
  species: z.string(),
  category: z.string(),
  _exportedAt: z.string(),
});

// App Link schema
export const appLinkSchema = z.object({
  id: z.string(),
  url: z.string(),
  _exportedAt: z.string(),
});

// Insert schemas (for creating new records)
export const insertBookSchema = bookSchema.omit({ id: true, _exportedAt: true });
export const insertWordSchema = wordSchema.omit({ id: true, _exportedAt: true });
export const insertDiseaseSchema = diseaseSchema.omit({ id: true, _exportedAt: true });
export const insertDrugSchema = drugSchema.omit({ id: true, _exportedAt: true });
export const insertTutorialVideoSchema = tutorialVideoSchema.omit({ id: true, _exportedAt: true });
export const insertStaffSchema = staffSchema.omit({ id: true, _exportedAt: true });
export const insertQuestionSchema = questionSchema.omit({ id: true, _exportedAt: true });
export const insertNotificationSchema = notificationSchema.omit({ id: true, _exportedAt: true });
export const insertUserSchema = userSchema.omit({ id: true, _exportedAt: true });
export const insertNormalRangeSchema = normalRangeSchema.omit({ id: true, _exportedAt: true });
export const insertAppLinkSchema = appLinkSchema.omit({ id: true, _exportedAt: true });

// Types
export type Book = z.infer<typeof bookSchema>;
export type Word = z.infer<typeof wordSchema>;
export type Disease = z.infer<typeof diseaseSchema>;
export type Drug = z.infer<typeof drugSchema>;
export type TutorialVideo = z.infer<typeof tutorialVideoSchema>;
export type Staff = z.infer<typeof staffSchema>;
export type Question = z.infer<typeof questionSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type User = z.infer<typeof userSchema>;
export type NormalRange = z.infer<typeof normalRangeSchema>;
export type AppLink = z.infer<typeof appLinkSchema>;

export type InsertBook = z.infer<typeof insertBookSchema>;
export type InsertWord = z.infer<typeof insertWordSchema>;
export type InsertDisease = z.infer<typeof insertDiseaseSchema>;
export type InsertDrug = z.infer<typeof insertDrugSchema>;
export type InsertTutorialVideo = z.infer<typeof insertTutorialVideoSchema>;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertNormalRange = z.infer<typeof insertNormalRangeSchema>;
export type InsertAppLink = z.infer<typeof insertAppLinkSchema>;

// Collection types
export type CollectionName = 
  | 'books'
  | 'words'
  | 'diseases'
  | 'drugs'
  | 'tutorialVideos'
  | 'staff'
  | 'questions'
  | 'notifications'
  | 'users'
  | 'normalRanges'
  | 'appLinks';

export type CollectionData = {
  books: Book[];
  words: Word[];
  diseases: Disease[];
  drugs: Drug[];
  tutorialVideos: TutorialVideo[];
  staff: Staff[];
  questions: Question[];
  notifications: Notification[];
  users: User[];
  normalRanges: NormalRange[];
  appLinks: AppLink[];
};

// ===== ADMIN AUTHENTICATION SYSTEM =====

// Admin Users Table
export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('admin'), // 'super_admin' or 'admin'
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
});

// Activity Logs Table
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').references(() => adminUsers.id).notNull(),
  action: varchar('action', { length: 50 }).notNull(), // 'create', 'update', 'delete'
  collection: varchar('collection', { length: 50 }).notNull(),
  documentId: varchar('document_id', { length: 255 }).notNull(),
  documentTitle: varchar('document_title', { length: 500 }),
  oldData: text('old_data'), // JSON string of previous data (for updates/deletes)
  newData: text('new_data'), // JSON string of new data (for creates/updates)
  timestamp: timestamp('timestamp').defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
});

// Admin Sessions Table
export const adminSessions = pgTable('admin_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').references(() => adminUsers.id).notNull(),
  sessionToken: varchar('session_token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
});

// Relations
export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  activityLogs: many(activityLogs),
  sessions: many(adminSessions),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  admin: one(adminUsers, {
    fields: [activityLogs.adminId],
    references: [adminUsers.id],
  }),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  admin: one(adminUsers, {
    fields: [adminSessions.adminId],
    references: [adminUsers.id],
  }),
}));

// Zod schemas for validation
export const adminUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['super_admin', 'admin']),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLoginAt: z.date().optional(),
});

export const activityLogSchema = z.object({
  id: z.string().uuid(),
  adminId: z.string().uuid(),
  action: z.enum(['create', 'update', 'delete']),
  collection: z.string().max(50),
  documentId: z.string().max(255),
  documentTitle: z.string().max(500).optional(),
  oldData: z.string().optional(),
  newData: z.string().optional(),
  timestamp: z.date(),
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().optional(),
});

export const adminSessionSchema = z.object({
  id: z.string().uuid(),
  adminId: z.string().uuid(),
  sessionToken: z.string().max(255),
  expiresAt: z.date(),
  createdAt: z.date(),
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().optional(),
});

// Insert schemas
export const insertAdminUserSchema = adminUserSchema.omit({ id: true, createdAt: true, updatedAt: true, lastLoginAt: true });
export const insertActivityLogSchema = activityLogSchema.omit({ id: true, timestamp: true });
export const insertAdminSessionSchema = adminSessionSchema.omit({ id: true, createdAt: true });

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Types
export type AdminUser = z.infer<typeof adminUserSchema>;
export type ActivityLog = z.infer<typeof activityLogSchema>;
export type AdminSession = z.infer<typeof adminSessionSchema>;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;
export type LoginData = z.infer<typeof loginSchema>;
