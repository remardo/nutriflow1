import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

/**
 * Singleton PrismaClient для всего backend.
 * Используется в том числе для /ready healthcheck.
 */
export const prisma: PrismaClient =
  global.__prisma__ ??
  new PrismaClient({
    log: process.env.PRISMA_LOG_QUERIES === 'true' ? ['query', 'error', 'warn'] : ['error', 'warn'],
  });

if (!global.__prisma__) {
  global.__prisma__ = prisma;
}