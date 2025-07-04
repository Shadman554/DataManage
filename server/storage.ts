import { FallbackStorage } from './storage-fallback';
import type { 
  Book, Word, Disease, Drug, TutorialVideo, Staff, Question, 
  Notification, User, NormalRange, AppLink,
  InsertBook, InsertWord, InsertDisease, InsertDrug, InsertTutorialVideo, 
  InsertStaff, InsertQuestion, InsertNotification, InsertUser, 
  InsertNormalRange, InsertAppLink, CollectionName 
} from '@shared/schema';

export interface IStorage {
  // Generic CRUD operations
  getCollection<T>(collectionName: CollectionName): Promise<T[]>;
  getDocument<T>(collectionName: CollectionName, id: string): Promise<T | null>;
  createDocument<T>(collectionName: CollectionName, data: any): Promise<T>;
  updateDocument<T>(collectionName: CollectionName, id: string, data: any): Promise<T>;
  deleteDocument(collectionName: CollectionName, id: string): Promise<void>;
  
  // Search and filter
  searchCollection<T>(collectionName: CollectionName, query: string, field?: string): Promise<T[]>;
  
  // Specific collection methods
  getBooks(): Promise<Book[]>;
  getWords(): Promise<Word[]>;
  getDiseases(): Promise<Disease[]>;
  getDrugs(): Promise<Drug[]>;
  getTutorialVideos(): Promise<TutorialVideo[]>;
  getStaff(): Promise<Staff[]>;
  getQuestions(): Promise<Question[]>;
  getNotifications(): Promise<Notification[]>;
  getUsers(): Promise<User[]>;
  getNormalRanges(): Promise<NormalRange[]>;
  getAppLinks(): Promise<AppLink[]>;
  
  createBook(book: InsertBook): Promise<Book>;
  createWord(word: InsertWord): Promise<Word>;
  createDisease(disease: InsertDisease): Promise<Disease>;
  createDrug(drug: InsertDrug): Promise<Drug>;
  createTutorialVideo(video: InsertTutorialVideo): Promise<TutorialVideo>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  createUser(user: InsertUser): Promise<User>;
  createNormalRange(range: InsertNormalRange): Promise<NormalRange>;
  createAppLink(link: InsertAppLink): Promise<AppLink>;
}

export class FirebaseStorage implements IStorage {
  private db: any = null;
  
  private async initializeFirebase() {
    if (!this.db) {
      try {
        const { db } = await import('./firebase');
        this.db = db;
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        throw error;
      }
    }
  }

  private generateId(): string {
    return Date.now().toString();
  }

  private getExportedAt(): string {
    return new Date().toISOString();
  }

  async getCollection<T>(collectionName: CollectionName): Promise<T[]> {
    try {
      await this.initializeFirebase();
      const snapshot = await this.db.collection(collectionName).get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
      console.error(`Error getting ${collectionName}:`, error);
      throw error;
    }
  }

  async getDocument<T>(collectionName: CollectionName, id: string): Promise<T | null> {
    try {
      await this.initializeFirebase();
      const doc = await this.db.collection(collectionName).doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() } as T;
    } catch (error) {
      console.error(`Error getting document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  async createDocument<T>(collectionName: CollectionName, data: any): Promise<T> {
    try {
      await this.initializeFirebase();
      const id = this.generateId();
      const docData = {
        ...data,
        id,
        _exportedAt: this.getExportedAt(),
      };
      
      await this.db.collection(collectionName).doc(id).set(docData);
      return docData as T;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  async updateDocument<T>(collectionName: CollectionName, id: string, data: any): Promise<T> {
    try {
      await this.initializeFirebase();
      const updateData = {
        ...data,
        _exportedAt: this.getExportedAt(),
      };
      
      await this.db.collection(collectionName).doc(id).update(updateData);
      
      const updatedDoc = await this.getDocument<T>(collectionName, id);
      return updatedDoc as T;
    } catch (error) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error);
      throw error;
    }
  }

  async deleteDocument(collectionName: CollectionName, id: string): Promise<void> {
    try {
      await this.initializeFirebase();
      await this.db.collection(collectionName).doc(id).delete();
    } catch (error) {
      console.error(`Error deleting document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  async searchCollection<T>(collectionName: CollectionName, query: string, field?: string): Promise<T[]> {
    try {
      await this.initializeFirebase();
      let dbQuery = this.db.collection(collectionName);
      
      if (field) {
        dbQuery = dbQuery.where(field, '>=', query).where(field, '<=', query + '\uf8ff');
      }
      
      const snapshot = await dbQuery.get();
      const results = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as T));
      
      // If no field specified, search across multiple fields
      if (!field && query) {
        return results.filter((item: any) => {
          const searchText = JSON.stringify(item).toLowerCase();
          return searchText.includes(query.toLowerCase());
        });
      }
      
      return results;
    } catch (error) {
      console.error(`Error searching ${collectionName}:`, error);
      throw error;
    }
  }

  // Specific collection methods
  async getBooks(): Promise<Book[]> {
    return this.getCollection<Book>('books');
  }

  async getWords(): Promise<Word[]> {
    return this.getCollection<Word>('words');
  }

  async getDiseases(): Promise<Disease[]> {
    return this.getCollection<Disease>('diseases');
  }

  async getDrugs(): Promise<Drug[]> {
    return this.getCollection<Drug>('drugs');
  }

  async getTutorialVideos(): Promise<TutorialVideo[]> {
    return this.getCollection<TutorialVideo>('tutorialVideos');
  }

  async getStaff(): Promise<Staff[]> {
    return this.getCollection<Staff>('staff');
  }

  async getQuestions(): Promise<Question[]> {
    return this.getCollection<Question>('questions');
  }

  async getNotifications(): Promise<Notification[]> {
    return this.getCollection<Notification>('notifications');
  }

  async getUsers(): Promise<User[]> {
    return this.getCollection<User>('users');
  }

  async getNormalRanges(): Promise<NormalRange[]> {
    return this.getCollection<NormalRange>('normalRanges');
  }

  async getAppLinks(): Promise<AppLink[]> {
    return this.getCollection<AppLink>('appLinks');
  }

  async createBook(book: InsertBook): Promise<Book> {
    return this.createDocument<Book>('books', book);
  }

  async createWord(word: InsertWord): Promise<Word> {
    return this.createDocument<Word>('words', word);
  }

  async createDisease(disease: InsertDisease): Promise<Disease> {
    return this.createDocument<Disease>('diseases', disease);
  }

  async createDrug(drug: InsertDrug): Promise<Drug> {
    return this.createDocument<Drug>('drugs', drug);
  }

  async createTutorialVideo(video: InsertTutorialVideo): Promise<TutorialVideo> {
    return this.createDocument<TutorialVideo>('tutorialVideos', video);
  }

  async createStaff(staff: InsertStaff): Promise<Staff> {
    return this.createDocument<Staff>('staff', staff);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    return this.createDocument<Question>('questions', question);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    return this.createDocument<Notification>('notifications', notification);
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.createDocument<User>('users', user);
  }

  async createNormalRange(range: InsertNormalRange): Promise<NormalRange> {
    return this.createDocument<NormalRange>('normalRanges', range);
  }

  async createAppLink(link: InsertAppLink): Promise<AppLink> {
    return this.createDocument<AppLink>('appLinks', link);
  }
}

// Create a hybrid storage that uses Firebase with fallback to JSON data
class HybridStorage implements IStorage {
  private firebaseStorage: FirebaseStorage;
  private fallbackStorage: FallbackStorage;
  private useFirebase: boolean = false; // Temporarily disabled until connection is fixed

  constructor() {
    this.firebaseStorage = new FirebaseStorage();
    this.fallbackStorage = new FallbackStorage();
  }

  // Method to enable Firebase (call this when credentials are working)
  enableFirebase() {
    console.log('Enabling Firebase storage...');
    this.useFirebase = true;
  }

  // Method to disable Firebase (fallback to JSON)
  disableFirebase() {
    console.log('Disabling Firebase storage, using fallback...');
    this.useFirebase = false;
  }

  // Check current storage mode
  getStorageMode() {
    return this.useFirebase ? 'firebase' : 'fallback';
  }

  private async executeWithFallback<T>(
    firebaseOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>
  ): Promise<T> {
    if (!this.useFirebase) {
      console.log('Using fallback storage (Firebase disabled)');
      return fallbackOperation();
    }

    try {
      console.log('Attempting Firebase operation...');
      const result = await firebaseOperation();
      console.log('Firebase operation successful');
      return result;
    } catch (error) {
      console.error('Firebase operation failed, switching to fallback:', error.message);
      this.useFirebase = false;
      return fallbackOperation();
    }
  }

  async getCollection<T>(collectionName: CollectionName): Promise<T[]> {
    return this.executeWithFallback(
      () => this.firebaseStorage.getCollection<T>(collectionName),
      () => this.fallbackStorage.getCollection<T>(collectionName)
    );
  }

  async getDocument<T>(collectionName: CollectionName, id: string): Promise<T | null> {
    return this.executeWithFallback(
      () => this.firebaseStorage.getDocument<T>(collectionName, id),
      () => this.fallbackStorage.getDocument<T>(collectionName, id)
    );
  }

  async createDocument<T>(collectionName: CollectionName, data: any): Promise<T> {
    return this.executeWithFallback(
      () => this.firebaseStorage.createDocument<T>(collectionName, data),
      () => this.fallbackStorage.createDocument<T>(collectionName, data)
    );
  }

  async updateDocument<T>(collectionName: CollectionName, id: string, data: any): Promise<T> {
    return this.executeWithFallback(
      () => this.firebaseStorage.updateDocument<T>(collectionName, id, data),
      () => this.fallbackStorage.updateDocument<T>(collectionName, id, data)
    );
  }

  async deleteDocument(collectionName: CollectionName, id: string): Promise<void> {
    return this.executeWithFallback(
      () => this.firebaseStorage.deleteDocument(collectionName, id),
      () => this.fallbackStorage.deleteDocument(collectionName, id)
    );
  }

  async searchCollection<T>(collectionName: CollectionName, query: string, field?: string): Promise<T[]> {
    return this.executeWithFallback(
      () => this.firebaseStorage.searchCollection<T>(collectionName, query, field),
      () => this.fallbackStorage.searchCollection<T>(collectionName, query, field)
    );
  }

  // Specific collection methods
  async getBooks(): Promise<Book[]> { return this.getCollection('books'); }
  async getWords(): Promise<Word[]> { return this.getCollection('words'); }
  async getDiseases(): Promise<Disease[]> { return this.getCollection('diseases'); }
  async getDrugs(): Promise<Drug[]> { return this.getCollection('drugs'); }
  async getTutorialVideos(): Promise<TutorialVideo[]> { return this.getCollection('tutorialVideos'); }
  async getStaff(): Promise<Staff[]> { return this.getCollection('staff'); }
  async getQuestions(): Promise<Question[]> { return this.getCollection('questions'); }
  async getNotifications(): Promise<Notification[]> { return this.getCollection('notifications'); }
  async getUsers(): Promise<User[]> { return this.getCollection('users'); }
  async getNormalRanges(): Promise<NormalRange[]> { return this.getCollection('normalRanges'); }
  async getAppLinks(): Promise<AppLink[]> { return this.getCollection('appLinks'); }

  async createBook(book: InsertBook): Promise<Book> { return this.createDocument('books', book); }
  async createWord(word: InsertWord): Promise<Word> { return this.createDocument('words', word); }
  async createDisease(disease: InsertDisease): Promise<Disease> { return this.createDocument('diseases', disease); }
  async createDrug(drug: InsertDrug): Promise<Drug> { return this.createDocument('drugs', drug); }
  async createTutorialVideo(video: InsertTutorialVideo): Promise<TutorialVideo> { return this.createDocument('tutorialVideos', video); }
  async createStaff(staff: InsertStaff): Promise<Staff> { return this.createDocument('staff', staff); }
  async createQuestion(question: InsertQuestion): Promise<Question> { return this.createDocument('questions', question); }
  async createNotification(notification: InsertNotification): Promise<Notification> { return this.createDocument('notifications', notification); }
  async createUser(user: InsertUser): Promise<User> { return this.createDocument('users', user); }
  async createNormalRange(range: InsertNormalRange): Promise<NormalRange> { return this.createDocument('normalRanges', range); }
  async createAppLink(link: InsertAppLink): Promise<AppLink> { return this.createDocument('appLinks', link); }
}

export const storage = new HybridStorage();
