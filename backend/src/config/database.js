import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ticketing_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✓ Database connected');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  // Don't crash the server on database errors - allow graceful degradation
  // Health check endpoint will report unhealthy status
});

/**
 * Test database connection with retry logic
 * Implements exponential backoff for connection failures
 */
export async function testConnection(maxRetries = 5) {
  let retries = 0;
  const baseDelay = 1000; // 1 second

  while (retries < maxRetries) {
    try {
      await pool.query('SELECT 1');
      console.log('✓ Database connection verified');
      return true;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        console.error(`Failed to connect to database after ${maxRetries} attempts`);
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = baseDelay * Math.pow(2, retries - 1);
      console.warn(`Database connection attempt ${retries} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

// Query helper function
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    // Only log query text in development to prevent sensitive data leakage
    if (process.env.NODE_ENV !== 'production') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    } else {
      console.log('Executed query', { duration, rows: res.rowCount });
    }

    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Transaction helper
export const getClient = () => pool.connect();

export default pool;
