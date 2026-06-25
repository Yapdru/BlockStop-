import { Pool } from "pg";
import { queryOptimizer } from "./db/query-optimizer";

// Create a connection pool to PostgreSQL with optimized settings
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  // Optimized pool settings for performance
  min: parseInt(process.env.DB_POOL_MIN || "5", 10),
  max: parseInt(process.env.DB_POOL_MAX || "20", 10),
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || "30000", 10),
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || "2000", 10),
});

// Log connection events
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    // Record metrics for query optimization
    queryOptimizer.recordQuery(
      text,
      duration,
      res.rowCount || 0,
      res.rowCount || 0,
      [] // Index usage would need to be extracted from EXPLAIN ANALYZE
    );

    console.log("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export async function getClient() {
  return pool.connect();
}

export async function getDb() {
  return pool;
}

export default pool;
