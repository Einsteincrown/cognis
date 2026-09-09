const { spawnSync } = require('child_process');
const path = require('path');

// Prisma needs a datasource during client generation, but generation itself does not connect to it.
const env = { ...process.env };
if (!env.DATABASE_URL) env.DATABASE_URL = 'postgresql://127.0.0.1:5432/cognis';

const prismaCli = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');
const result = spawnSync(process.execPath, [prismaCli, 'generate'], { env, stdio: 'inherit' });
process.exit(result.status ?? 1);
