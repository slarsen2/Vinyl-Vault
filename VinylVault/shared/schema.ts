import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
});

export const records = pgTable("records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  year: text("year"),
  genre: text("genre"),
  coverImage: text("cover_image"),
  customFields: jsonb("custom_fields"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRecordSchema = createInsertSchema(records).omit({
  id: true,
  createdAt: true,
});

export const customFieldSchema = z.object({
  name: z.string(),
  value: z.string(),
});

export type CustomField = z.infer<typeof customFieldSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRecord = z.infer<typeof insertRecordSchema>;
export type Record = typeof records.$inferSelect;
