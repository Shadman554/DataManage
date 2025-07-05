import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

// Check if we have a proper DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

let connection: mysql.Connection | null = null;
let db: any = null;

async function initializeDatabase() {
  if (!databaseUrl) {
    console.warn("No DATABASE_URL found, admin features will be limited");
    connection = null;
    db = null;
    return;
  }

  console.log("Connecting to MySQL database:", databaseUrl.replace(/\/\/.*@/, "//***@"));
  
  try {
    // Create MySQL connection
    connection = await mysql.createConnection(databaseUrl);
    db = drizzle(connection, { schema, mode: 'default' });
    console.log("MySQL database connected successfully");
  } catch (error) {
    console.error("Failed to connect to MySQL database:", error);
    connection = null;
    db = null;
  }
}

// Initialize database connection
if (databaseUrl) {
  initializeDatabase().catch(console.error);
}

export { connection, db };
