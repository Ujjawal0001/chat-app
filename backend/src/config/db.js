import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: config.isProduction ? ['error', 'warn'] : ['query', 'error', 'warn'],
  });
};

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (!config.isProduction) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
