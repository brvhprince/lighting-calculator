import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client';
import { MARKETS } from '../src/config/markets';

// Seeds the Setting table with the current markets.ts defaults under key
// "markets", so the DB-backed config starts from a known-good baseline.
// Run with: npm run db:seed
loadEnv({ path: '.env.local' });
loadEnv();

const prisma = new PrismaClient({ accelerateUrl: process.env.DATABASE_URL as string });

async function main() {
  await prisma.setting.upsert({
    where: { key: 'markets' },
    update: { value: MARKETS as object },
    create: { key: 'markets', value: MARKETS as object },
  });
  console.log('✓ Seeded "markets" config from src/config/markets.ts');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
