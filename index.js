var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import createMemoryStore from "memorystore";
import session2 from "express-session";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  customFieldSchema: () => customFieldSchema,
  insertRecordSchema: () => insertRecordSchema,
  insertUserSchema: () => insertUserSchema,
  records: () => records,
  users: () => users
});
import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true
});
var records = pgTable("records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  year: text("year"),
  genre: text("genre"),
  coverImage: text("cover_image"),
  customFields: jsonb("custom_fields"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertRecordSchema = createInsertSchema(records).omit({
  id: true,
  createdAt: true
});
var customFieldSchema = z.object({
  name: z.string(),
  value: z.string()
});

// server/db.ts
neonConfig.webSocketConstructor = ws;
var pool = null;
var db = null;
try {
  if (process.env.DATABASE_URL) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema: schema_exports });
    console.log("Database connection established successfully");
  } else {
    console.warn("DATABASE_URL is not set. Database features will be unavailable.");
  }
} catch (error) {
  console.error("Failed to connect to database:", error);
}

// server/database-storage.ts
import { eq, like, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    if (!pool) {
      throw new Error("Database pool is not initialized. Cannot use DatabaseStorage.");
    }
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  async getUser(id) {
    if (!db) return void 0;
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async getUserByUsername(username) {
    if (!db) return void 0;
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  async createUser(insertUser) {
    if (!db) {
      throw new Error("Database not available");
    }
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getRecords(userId) {
    if (!db) return [];
    const result = await db.select().from(records).where(eq(records.userId, userId));
    return result;
  }
  async getRecord(id) {
    if (!db) return void 0;
    const result = await db.select().from(records).where(eq(records.id, id));
    return result[0];
  }
  async createRecord(insertRecord) {
    if (!db) {
      throw new Error("Database not available");
    }
    const [record] = await db.insert(records).values(insertRecord).returning();
    return record;
  }
  async updateRecord(id, updateData) {
    if (!db) return void 0;
    const [updatedRecord] = await db.update(records).set(updateData).where(eq(records.id, id)).returning();
    return updatedRecord;
  }
  async deleteRecord(id) {
    if (!db) return false;
    const result = await db.delete(records).where(eq(records.id, id)).returning();
    return result.length > 0;
  }
  async searchRecords(userId, query) {
    if (!db) return [];
    const lowerQuery = `%${query.toLowerCase()}%`;
    const result = await db.select().from(records).where(
      eq(records.userId, userId) && or(
        like(records.title, lowerQuery),
        like(records.artist, lowerQuery),
        like(records.genre || "", lowerQuery),
        like(records.year || "", lowerQuery)
      )
    );
    return result;
  }
};

// server/storage.ts
var MemoryStore = createMemoryStore(session2);
var MemStorage = class {
  users;
  records;
  currentUserId;
  currentRecordId;
  sessionStore;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.records = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentRecordId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 864e5
    });
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const createdAt = /* @__PURE__ */ new Date();
    const user = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  async getRecords(userId) {
    return Array.from(this.records.values()).filter(
      (record) => record.userId === userId
    );
  }
  async getRecord(id) {
    return this.records.get(id);
  }
  async createRecord(insertRecord) {
    const id = this.currentRecordId++;
    const createdAt = /* @__PURE__ */ new Date();
    const record = { ...insertRecord, id, createdAt };
    this.records.set(id, record);
    return record;
  }
  async updateRecord(id, updateData) {
    const existingRecord = this.records.get(id);
    if (!existingRecord) {
      return void 0;
    }
    const updatedRecord = { ...existingRecord, ...updateData };
    this.records.set(id, updatedRecord);
    return updatedRecord;
  }
  async deleteRecord(id) {
    return this.records.delete(id);
  }
  async searchRecords(userId, query) {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.records.values()).filter(
      (record) => record.userId === userId && (record.title.toLowerCase().includes(lowerQuery) || record.artist.toLowerCase().includes(lowerQuery) || record.genre?.toLowerCase().includes(lowerQuery) || record.year?.toLowerCase().includes(lowerQuery))
    );
  }
};
var storage;
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

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session3 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "vinyl-vault-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1e3
      // 30 days
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session3(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !await comparePasswords(password, user.password)) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }
    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password)
    });
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// server/metadata.ts
import axios from "axios";
async function searchRecordMetadata(artist, title) {
  try {
    const query = encodeURIComponent(`${artist} ${title}`);
    const discogsToken = process.env.DISCOGS_TOKEN || "";
    const response = await axios.get(
      `https://api.discogs.com/database/search?q=${query}&type=release&per_page=3`,
      {
        headers: {
          "Authorization": `Discogs token=${discogsToken}`,
          "User-Agent": "VinylVault/1.0"
        }
      }
    );
    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        year: result.year,
        genres: result.genre || result.style
      };
    }
    return {};
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return {};
  }
}

// server/routes.ts
import { z as z2 } from "zod";
async function registerRoutes(app2) {
  setupAuth(app2);
  const authenticateMiddleware = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    next();
  };
  app2.get("/api/records", authenticateMiddleware, async (req, res) => {
    try {
      const records2 = await storage.getRecords(req.user.id);
      res.json(records2);
    } catch (error) {
      res.status(500).send("Error retrieving records");
    }
  });
  app2.get("/api/records/:id", authenticateMiddleware, async (req, res) => {
    try {
      const recordId = parseInt(req.params.id);
      const record = await storage.getRecord(recordId);
      if (!record) {
        return res.status(404).send("Record not found");
      }
      if (record.userId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      res.json(record);
    } catch (error) {
      res.status(500).send("Error retrieving record");
    }
  });
  app2.post("/api/records", authenticateMiddleware, async (req, res) => {
    try {
      const recordData = insertRecordSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const record = await storage.createRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Error creating record");
    }
  });
  app2.put("/api/records/:id", authenticateMiddleware, async (req, res) => {
    try {
      const recordId = parseInt(req.params.id);
      const existingRecord = await storage.getRecord(recordId);
      if (!existingRecord) {
        return res.status(404).send("Record not found");
      }
      if (existingRecord.userId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      const updatedRecord = await storage.updateRecord(recordId, req.body);
      res.json(updatedRecord);
    } catch (error) {
      res.status(500).send("Error updating record");
    }
  });
  app2.delete("/api/records/:id", authenticateMiddleware, async (req, res) => {
    try {
      const recordId = parseInt(req.params.id);
      const existingRecord = await storage.getRecord(recordId);
      if (!existingRecord) {
        return res.status(404).send("Record not found");
      }
      if (existingRecord.userId !== req.user.id) {
        return res.status(403).send("Access denied");
      }
      await storage.deleteRecord(recordId);
      res.status(204).send();
    } catch (error) {
      res.status(500).send("Error deleting record");
    }
  });
  app2.get("/api/records/search/:query", authenticateMiddleware, async (req, res) => {
    try {
      const { query } = req.params;
      const records2 = await storage.searchRecords(req.user.id, query);
      res.json(records2);
    } catch (error) {
      res.status(500).send("Error searching records");
    }
  });
  app2.post("/api/metadata/lookup", authenticateMiddleware, async (req, res) => {
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var REPO_NAME = "Vinyl-Vault";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  // Add base path for GitHub Pages deployment with string literal
  base: process.env.NODE_ENV === "production" ? `/${REPO_NAME}/` : "/",
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import dotenv from "dotenv";
dotenv.config();
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
