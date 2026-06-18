import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton — avoids exhausting DB connections during Next.js
 * hot-reload in development.
 *
 * NOTE: This module (and everything under src/server/) is the DB-backed
 * "production" layer. It is excluded from the demo build via tsconfig until
 * you run `npm run db:generate` on a machine with PostgreSQL available.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
