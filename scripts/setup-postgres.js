const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
const schemaPath = path.join(root, 'prisma', 'schema.prisma');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function isPlaceholderDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    const database = parsed.pathname.replace(/^\//, '');
    return [parsed.username, parsed.password, parsed.hostname, database].some((part) =>
      ['USER', 'PASSWORD', 'HOST', 'DATABASE'].includes(decodeURIComponent(part || '').toUpperCase())
    );
  } catch (error) {
    return false;
  }
}

function resolveDatabaseUrl() {
  const explicitArg = process.argv.slice(2).find((arg) => arg && !arg.startsWith('--'));
  const envFile = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const envFileMatch = envFile.match(/^DATABASE_URL=(?:"([^"]*)"|'([^']*)'|([^\r\n]*))/m);
  const envFileUrl = envFileMatch ? (envFileMatch[1] || envFileMatch[2] || envFileMatch[3] || '').trim() : '';
  const url = explicitArg || process.env.COGNIS_DATABASE_URL || process.env.DATABASE_URL || envFileUrl;

  if (!/^postgres(ql)?:\/\//.test(url) || isPlaceholderDatabaseUrl(url)) {
    fail([
      'Cognis needs a real PostgreSQL DATABASE_URL.',
      '',
      'Run one of these:',
      '  npm run setup:db -- "postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"',
      '  $env:COGNIS_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"; npm run setup:db',
    ].join('\n'));
  }

  return url;
}

function writeEnv(databaseUrl) {
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const line = `DATABASE_URL="${databaseUrl.replace(/"/g, '\\"')}"`;

  const next = existing.match(/^DATABASE_URL=.*$/m)
    ? existing.replace(/^DATABASE_URL=.*$/m, line)
    : `${existing.replace(/\s*$/, '')}${existing.trim() ? '\n' : ''}${line}\n`;

  fs.writeFileSync(envPath, next);
  console.log('Updated .env DATABASE_URL.');
}

function assertPostgresSchema() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  if (!/provider\s*=\s*"postgresql"/.test(schema)) {
    fail('prisma/schema.prisma must use provider = "postgresql".');
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    fail(`${command} ${args.join(' ')} failed.`);
  }
}

const databaseUrl = resolveDatabaseUrl();
assertPostgresSchema();
writeEnv(databaseUrl);

const prismaCli = path.join(root, 'node_modules', 'prisma', 'build', 'index.js');
run(process.execPath, [prismaCli, 'generate']);
run(process.execPath, [prismaCli, 'migrate', 'deploy']);
run(process.execPath, [prismaCli, 'db', 'seed']);

console.log('Cognis PostgreSQL setup complete.');
