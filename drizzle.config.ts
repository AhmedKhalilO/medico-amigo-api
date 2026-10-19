import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

loadEnvConfig(process.cwd()); // lit .env comme Next.js

const url = process.env.DATABASE_URL ?? 'file:./dev.db';
const authToken = process.env.DATABASE_AUTH_TOKEN;

// Turso (production) : libsql://… + jeton. Fichier local : file:./dev.db
export default authToken
  ? defineConfig({
      dialect: 'turso',
      schema: './src/db/schema.ts',
      dbCredentials: { url, authToken },
    })
  : defineConfig({
      dialect: 'sqlite',
      schema: './src/db/schema.ts',
      dbCredentials: { url },
    });