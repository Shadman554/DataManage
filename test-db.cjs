const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("No DATABASE_URL found");
    process.exit(1);
}

console.log("Connecting to PostgreSQL database:", databaseUrl.replace(/\/\/.*@/, "\/\/***@"));

const pool = new Pool({
    connectionString: databaseUrl
});

pool.query('SELECT 1', (err, res) => {
    if (err) {
        console.error("Error connecting to database:", err);
        process.exit(1);
    }
    console.log("Successfully connected to PostgreSQL database");
    pool.end();
});
