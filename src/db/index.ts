import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Une seule connexion en développement (le hot reload recréerait sinon un client à chaque modification).
const globalForDb = globalThis as unknown as { libsql?: ReturnType<typeof createClient> };

const client =
  globalForDb.libsql ??
  createClient({
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
    authToken: process.env.DATABASE_AUTH_TOKEN, // requis pour Turso, ignoré en local
  });

if (process.env.NODE_ENV !== 'production') globalForDb.libsql = client;

export const db = drizzle(client, { schema });
export * from './schema';