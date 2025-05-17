import { users, records, type User, type InsertUser, type Record, type InsertRecord } from "@shared/schema";
import { db } from "./db";
import { eq, like, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { IStorage } from "./storage";

// Use connect-pg-simple for PostgreSQL session store
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    // Check if the database pool exists
    if (!pool) {
      throw new Error("Database pool is not initialized. Cannot use DatabaseStorage.");
    }
    
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    if (!db) return undefined;
    
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) return undefined;
    
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) {
      throw new Error("Database not available");
    }
    
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getRecords(userId: number): Promise<Record[]> {
    if (!db) return [];
    
    const result = await db.select().from(records).where(eq(records.userId, userId));
    return result;
  }

  async getRecord(id: number): Promise<Record | undefined> {
    if (!db) return undefined;
    
    const result = await db.select().from(records).where(eq(records.id, id));
    return result[0];
  }

  async createRecord(insertRecord: InsertRecord): Promise<Record> {
    if (!db) {
      throw new Error("Database not available");
    }
    
    const [record] = await db.insert(records).values(insertRecord).returning();
    return record;
  }

  async updateRecord(id: number, updateData: Partial<InsertRecord>): Promise<Record | undefined> {
    if (!db) return undefined;
    
    const [updatedRecord] = await db
      .update(records)
      .set(updateData)
      .where(eq(records.id, id))
      .returning();
    
    return updatedRecord;
  }

  async deleteRecord(id: number): Promise<boolean> {
    if (!db) return false;
    
    const result = await db.delete(records).where(eq(records.id, id)).returning();
    return result.length > 0;
  }

  async searchRecords(userId: number, query: string): Promise<Record[]> {
    if (!db) return [];
    
    const lowerQuery = `%${query.toLowerCase()}%`;
    
    const result = await db
      .select()
      .from(records)
      .where(
        eq(records.userId, userId) && 
        or(
          like(records.title, lowerQuery),
          like(records.artist, lowerQuery),
          like(records.genre || "", lowerQuery),
          like(records.year || "", lowerQuery)
        )
      );
    
    return result;
  }
}