import { z } from "zod";

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
