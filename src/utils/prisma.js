const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;
const prisma = globalForPrisma.cognisPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.cognisPrisma = prisma;
}

module.exports = prisma;
