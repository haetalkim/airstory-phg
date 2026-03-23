import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

if (!env.databaseUrl) {
  // Keep startup explicit if DB URL is missing.
  console.warn("DATABASE_URL is not configured. Database features will fail.");
}

export const pool = new Pool({
  connectionString: env.databaseUrl,
});
