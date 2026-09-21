import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Neon over WebSocket (port 443): works on Vercel and on networks that don't pass raw Postgres traffic.
neonConfig.webSocketConstructor = ws;

function makeClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}

const globalForDb = globalThis as unknown as { db?: PrismaClient };

/** Pooled connection. One client per server instance, reused across hot reloads in development. */
export const db: PrismaClient = globalForDb.db ?? makeClient();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;

export type Db = typeof db;
