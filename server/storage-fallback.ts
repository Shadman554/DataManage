import fs from 'fs';
import path from 'path';
import type { 
  Book, Word, Disease, Drug, TutorialVideo, Staff, Question, 
  Notification, User, NormalRange, AppLink,
  InsertBook, InsertWord, InsertDisease, InsertDrug, InsertTutorialVideo, 
  InsertStaff, InsertQuestion, InsertNotification, InsertUser, 
  InsertNormalRange, InsertAppLink, CollectionName 
} from '@shared/schema';
import { IStorage } from './storage';

export class FallbackStorage implements IStorage {
  private data: Record<string, any[]> = {};
  
  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      const dataDir = path.join(process.cwd(), 'attached_assets');
      
      // Map file names to collection names
      const fileMapping: Record<string, string> = {
        'books_1751635801804.json': 'books',
        'words_1751635801806.json': 'words',
        'diseases_1751635801804.json': 'diseases',
        'drugs_1751635801805.json': 'drugs',
        'tutorialVideos_1751635801806.json': 'tutorialVideos',
        'staff_1751635801806.json': 'staff',
        'questions_1751635801805.json': 'questions',
        'notifications_1751635801805.json': 'notifications',
        'users_1751635801806.json': 'users',
        'Normal_Ranges_1751635801805.json': 'normalRanges',
        'app_links_1751635801804.json': 'appLinks'
      };
      
      for (const [fileName, collectionName] of Object.entries(fileMapping)) {
        try {
          const filePath = path.join(dataDir, fileName);
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            this.data[collectionName] = JSON.parse(content);
          }
        } catch (fileError) {
          console.warn(`Error loading ${fileName}:`, fileError);
        }
      }
      
      console.log('Loaded fallback data for collections:', Object.keys(this.data));
    } catch (error) {
      console.error('Error loading fallback data:', error);
      this.data = {};
    }
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private getExportedAt(): string {
    return new Date().toISOString();
  }

  async getCollection<T>(collectionName: CollectionName): Promise<T[]> {
    return this.data[collectionName] || [];
  }

  async getDocument<T>(collectionName: CollectionName, id: string): Promise<T | null> {
    const collection = this.data[collectionName] || [];
    return collection.find(item => item.id === id) || null;
  }

  async createDocument<T>(collectionName: CollectionName, data: any): Promise<T> {
    const newDoc = {
      id: this.generateId(),
      _exportedAt: this.getExportedAt(),
      ...data
    };
    
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }
    
    this.data[collectionName].push(newDoc);
    return newDoc as T;
  }

  async updateDocument<T>(collectionName: CollectionName, id: string, data: any): Promise<T> {
    const collection = this.data[collectionName] || [];
    const index = collection.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Document with id ${id} not found in collection ${collectionName}`);
    }
    
    collection[index] = { ...collection[index], ...data };
    return collection[index] as T;
  }

  async deleteDocument(collectionName: CollectionName, id: string): Promise<void> {
    const collection = this.data[collectionName] || [];
    const index = collection.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Document with id ${id} not found in collection ${collectionName}`);
    }
    
    collection.splice(index, 1);
  }

  async searchCollection<T>(collectionName: CollectionName, query: string, field?: string): Promise<T[]> {
    const collection = this.data[collectionName] || [];
    const lowerQuery = query.toLowerCase();
    
    return collection.filter(item => {
      if (field) {
        return item[field]?.toString().toLowerCase().includes(lowerQuery);
      }
      
      return Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(lowerQuery)
      );
    });
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