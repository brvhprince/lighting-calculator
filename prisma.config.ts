import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// The Prisma CLI doesn't auto-load .env.local (Next does), so load it here for
// migrate / db push / seed. .env is loaded as a fallback.
loadEnv({ path: '.env.local' });
loadEnv();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Used by the CLI for `db push` / migrate / introspection.
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
