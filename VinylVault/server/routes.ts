import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { searchRecordMetadata } from "./metadata";
import { insertRecordSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Check if a user is authenticated
  const authenticateMiddleware = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    next();
  };

  // Get all records for the current user
  app.get("/api/records", authenticateMiddleware, async (req, res) => {
    try {
      const records = await storage.getRecords(req.user!.id);
      res.json(records);
    } catch (error) {
      res.status(500).send("Error retrieving records");
    }
  });

  // Get a specific record by ID
  app.get("/api/records/:id", authenticateMiddleware, async (req, res) => {
    try {
      const recordId = parseInt(req.params.id);
      const record = await storage.getRecord(recordId);
      
      if (!record) {
        return res.status(404).send("Record not found");
      }
      
      // Make sure the record belongs to the current user
      if (record.userId !== req.user!.id) {
        return res.status(403).send("Access denied");
      }
      
      res.json(record);
    } catch (error) {
      res.status(500).send("Error retrieving record");
    }
  });

  // Create a new record
  app.post("/api/records", authenticateMiddleware, async (req, res) => {
    try {
      const recordData = insertRecordSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const record = await storage.createRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Error creating record");
    }
  });

  // Update a record
  app.put("/api/records/:id", authenticateMiddleware, async (req, res) => {
    try {
      const recordId = parseInt(req.params.id);
      const existingRecord = await storage.getRecord(recordId);
      
      if (!existingRecord) {
        return res.status(404).send("Record not found");
      }
      
      // Make sure the record belongs to the current user
      if (existingRecord.userId !== req.user!.id) {
        return res.status(403).send("Access denied");
      }
      
      const updatedRecord = await storage.updateRecord(recordId, req.body);
      res.json(updatedRecord);
    } catch (error) {
      res.status(500).send("Error updating record");
    }
  });

  // Delete a record
  app.delete("/api/records/:id", authenticateMiddleware, async (req, res) => {
    try {
      const recordId = parseInt(req.params.id);
      const existingRecord = await storage.getRecord(recordId);
      
      if (!existingRecord) {
        return res.status(404).send("Record not found");
      }
      
      // Make sure the record belongs to the current user
      if (existingRecord.userId !== req.user!.id) {
        return res.status(403).send("Access denied");
      }
      
      await storage.deleteRecord(recordId);
      res.status(204).send();
    } catch (error) {
      res.status(500).send("Error deleting record");
    }
  });

  // Search records
  app.get("/api/records/search/:query", authenticateMiddleware, async (req, res) => {
    try {
      const { query } = req.params;
      const records = await storage.searchRecords(req.user!.id, query);
      res.json(records);
    } catch (error) {
      res.status(500).send("Error searching records");
    }
  });

  // Lookup metadata for a record
  app.post("/api/metadata/lookup", authenticateMiddleware, async (req, res) => {
    try {
      const { artist, title } = req.body;
      
      if (!artist || !title) {
        return res.status(400).send("Artist and title are required");
      }
      
      const metadata = await searchRecordMetadata(artist, title);
      res.json(metadata);
    } catch (error) {
      res.status(500).send("Error looking up metadata");
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
