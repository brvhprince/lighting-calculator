import { PrismaClient } from '@/generated/prisma/client';

// Prisma 7 + Prisma Postgres: connect through Accelerate by passing the
// prisma+postgres:// URL as `accelerateUrl`. A global singleton avoids
// exhausting connections during dev hot-reload / serverless reuse.
const makeClient = () => new PrismaClient({ accelerateUrl: process.env.DATABASE_URL as string });

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof makeClient> };

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
