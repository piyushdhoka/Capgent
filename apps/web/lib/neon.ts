import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL is not set');
}

/**
 * Direct Neon HTTP client.
 * Direct Neon HTTP client for maximum stability.
 */
export const sql = neon(url);

/**
 * Helper to test the connection
 */
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as now`;
    console.log('✅ [Neon HTTP] Connection successful:', result[0].now);
    return true;
  } catch (error) {
    console.error('❌ [Neon HTTP] Connection failed:', error);
    return false;
  }
}
