require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

function isPlaceholderDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    const database = parsed.pathname.replace(/^\//, '');
    return [parsed.username, parsed.password, parsed.hostname, database].some((part) => {
      const normalized = decodeURIComponent(part || '').toUpperCase();
      return ['USER', 'PASSWORD', 'HOST', 'POOLER_HOST', 'DATABASE'].includes(normalized) || normalized.includes('POOLER_HOST');
    });
  } catch (error) {
    return false;
  }
}

function assertDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL || '';
  if (!/^postgres(ql)?:\/\//.test(databaseUrl) || isPlaceholderDatabaseUrl(databaseUrl)) {
    throw new Error(
      'Cognis requires DATABASE_URL to be a real PostgreSQL connection string. Run `npm run setup:db -- "<postgres-url>"` or update .env.'
    );
  }
}

const globalForPrisma = globalThis;

function getPrisma() {
  assertDatabaseUrl();

  if (!globalForPrisma.cognisPrisma) {
    globalForPrisma.cognisPrisma = new PrismaClient();
  }

  return globalForPrisma.cognisPrisma;
}

const prisma = new Proxy({}, {
  get(_target, property) {
    return getPrisma()[property];
  },
});

module.exports = prisma;
