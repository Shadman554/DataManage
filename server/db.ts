import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check if we have a proper DATABASE_URL with neon
const databaseUrl = process.env.DATABASE_URL;

let pool: Pool | null = null;
let db: any = null;

if (!databaseUrl) {
  console.warn("No DATABASE_URL found, admin features will be limited");
  pool = null;
  db = null;
} else {
  console.log("Connecting to database:", databaseUrl.replace(/\/\/.*@/, "//***@"));
  pool = new Pool({ connectionString: databaseUrl });
  db = drizzle({ client: pool, schema });
}

export { pool, db };
