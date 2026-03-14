import { neon } from '@neondatabase/serverless';
import type { Env } from '../config';

export function createDb(env: Env) {
  if (!env.DATABASE_URL) {
    throw new Error('Missing DATABASE_URL in API environment');
  }
  return neon(env.DATABASE_URL);
}
