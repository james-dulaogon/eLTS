import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const envFile = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
].find((candidate) => fs.existsSync(candidate));

if (envFile) {
  dotenv.config({ path: envFile });
}

function requiredSetting(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing database configuration: set ${name}.`);
  }
  return value;
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: requiredSetting('DB_USER', process.env.POSTGRES_USER),
  password: requiredSetting('DB_PASSWORD', process.env.POSTGRES_PASSWORD),
  database: requiredSetting('DB_NAME', process.env.POSTGRES_DB),
  max: 20, // Max concurrent connections optimized for local server runtime
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Logging status checks for tracking local system queries
pool.on('connect', () => {
  console.log('⚡ High-performance raw PostgreSQL connection established locally.');
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
