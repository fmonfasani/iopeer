# IOpeer (monorepo)
- apps/web: Next.js 14
- apps/api: NestJS + Prisma
- packages/sdk: TS shared

## Scripts
pnpm dev | build | lint | test

## First run
1) Copy .env.example -> .env and fill values
2) cd apps/api && pnpm prisma:generate && pnpm prisma:migrate
3) pnpm dev
# analyst_agent
