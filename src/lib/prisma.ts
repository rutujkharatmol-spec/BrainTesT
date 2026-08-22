import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Query logging writes every SELECT/INSERT — including phone numbers,
    // addresses and passcode hashes — to the log stream, and costs time on
    // the hot path. Errors only in production.
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
