import { type User, type InsertUser, type Record, type InsertRecord } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { pool } from "./db";
import { DatabaseStorage } from "./database-storage";

// CRUD methods interface
export interface IStorage {
  // User-related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Record-related methods
  getRecords(userId: number): Promise<Record[]>;
  getRecord(id: number): Promise<Record | undefined>;
  createRecord(record: InsertRecord): Promise<Record>;
  updateRecord(id: number, record: Partial<InsertRecord>): Promise<Record | undefined>;
  deleteRecord(id: number): Promise<boolean>;
  searchRecords(userId: number, query: string): Promise<Record[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private records: Map<number, Record>;
  currentUserId: number;
  currentRecordId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.records = new Map();
    this.currentUserId = 1;
    this.currentRecordId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  async getRecords(userId: number): Promise<Record[]> {
    return Array.from(this.records.values()).filter(
      (record) => record.userId === userId
    );
  }

  async getRecord(id: number): Promise<Record | undefined> {
    return this.records.get(id);
  }

  async createRecord(insertRecord: InsertRecord): Promise<Record> {
    const id = this.currentRecordId++;
    const createdAt = new Date();
    const record: Record = { ...insertRecord, id, createdAt };
    this.records.set(id, record);
    return record;
  }

  async updateRecord(id: number, updateData: Partial<InsertRecord>): Promise<Record | undefined> {
    const existingRecord = this.records.get(id);
    if (!existingRecord) {
      return undefined;
    }
    
    const updatedRecord = { ...existingRecord, ...updateData };
    this.records.set(id, updatedRecord);
    return updatedRecord;
  }

  async deleteRecord(id: number): Promise<boolean> {
    return this.records.delete(id);
  }

  async searchRecords(userId: number, query: string): Promise<Record[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.records.values()).filter(
      (record) => 
        record.userId === userId && 
        (record.title.toLowerCase().includes(lowerQuery) || 
         record.artist.toLowerCase().includes(lowerQuery) ||
         record.genre?.toLowerCase().includes(lowerQuery) ||
         record.year?.toLowerCase().includes(lowerQuery))
    );
  }
}

// Determine which storage implementation to use
let storage: IStorage;

try {
  if (pool) {
    console.log("Using DatabaseStorage with PostgreSQL");
    storage = new DatabaseStorage();
  } else {
    console.log("Database not available. Using in-memory storage.");
    storage = new MemStorage();
  }
} catch (error) {
  console.error("Error initializing database storage:", error);
  console.log("Falling back to in-memory storage.");
  storage = new MemStorage();
}

export { storage };
