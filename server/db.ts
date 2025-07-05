import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool as PgPool } from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check if we have a proper DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

let pool: Pool | PgPool | null = null;
let db: any = null;

if (!databaseUrl) {
  console.warn("No DATABASE_URL found, admin features will be limited");
  pool = null;
  db = null;
} else {
  console.log("Connecting to database:", databaseUrl.replace(/\/\/.*@/, "//***@"));
  
  // Check if it's a Neon database (contains 'neon' in the URL)
  if (databaseUrl.includes('neon')) {
    pool = new Pool({ connectionString: databaseUrl });
    db = drizzle({ client: pool, schema });
  } else {
    // Use standard PostgreSQL connection for Railway/other providers
    pool = new PgPool({ 
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });
    db = drizzlePg(pool, { schema });
  }
}

export { pool, db };
