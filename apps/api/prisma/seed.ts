import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // TODO: crea un usuario/agent/workflow demo
}
main().finally(() => prisma.$disconnect());
