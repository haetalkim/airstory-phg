import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

if (!env.databaseUrl) {
  // Keep startup explicit if DB URL is missing.
  console.warn("DATABASE_URL is not configured. Database features will fail.");
}

// Render / cloud Postgres requires TLS for external connections. Without this,
// local `npm run db:migrate` fails with: "SSL/TLS required".
const url = env.databaseUrl || "";
const isLocalDb =
  /localhost|127\.0\.0\.1/.test(url) ||
  /^postgresql:\/\/postgres:postgres@/.test(url);

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ...(isLocalDb ? {} : { ssl: { rejectUnauthorized: false } }),
});
