import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

// Try to connect to the database, but don't throw an error if it's not available
try {
  if (process.env.DATABASE_URL) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log("Database connection established successfully");
  } else {
    console.warn("DATABASE_URL is not set. Database features will be unavailable.");
  }
} catch (error) {
  console.error("Failed to connect to database:", error);
}

export { pool, db };
