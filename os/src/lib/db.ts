import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Next.js dev-mode hot reload creates a new module instance per request
// unless the client is cached on `globalThis`. Also keeps Prisma from
// exhausting Postgres connections in serverless environments.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and point it " +
        "at your Supabase Postgres connection string (see /docs/setup.md).",
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Lazily instantiated behind a Proxy: importing this module (e.g. via the
// (app) layout -> session.ts import chain) must never fail just because
// Next.js is statically analysing route modules at build time without
// DATABASE_URL present. The connection is only opened on first real query.
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrismaClient(), prop, receiver);
  },
});
