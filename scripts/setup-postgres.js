const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
const schemaPath = path.join(root, 'prisma', 'schema.prisma');
const placeholderParts = ['USER', 'PASSWORD', 'HOST', 'POOLER_HOST', 'DATABASE'];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function isPlaceholderDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    const database = parsed.pathname.replace(/^\//, '');
    return [parsed.username, parsed.password, parsed.hostname, database].some((part) => {
      const normalized = decodeURIComponent(part || '').toUpperCase();
      return placeholderParts.includes(normalized) || normalized.includes('POOLER_HOST');
    });
  } catch (error) {
    return false;
  }
}

function readEnvFile() {
  return fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
}

function readEnvValue(envFile, key) {
  const match = envFile.match(new RegExp(`^${key}=(?:"([^"]*)"|'([^']*)'|([^\\r\\n]*))`, 'm'));
  return match ? (match[1] || match[2] || match[3] || '').trim() : '';
}

function resolveDatabaseUrls() {
  const explicitArg = process.argv.slice(2).find((arg) => arg && !arg.startsWith('--'));
  const explicitDirectArg = process.argv.slice(2).find((arg) => arg.startsWith('--direct-url='));
  const envFile = readEnvFile();
  const databaseUrl = explicitArg || process.env.COGNIS_DATABASE_URL || process.env.DATABASE_URL || readEnvValue(envFile, 'DATABASE_URL');
  const directUrl = explicitDirectArg?.replace(/^--direct-url=/, '') || process.env.COGNIS_DIRECT_URL || process.env.DIRECT_URL || readEnvValue(envFile, 'DIRECT_URL') || databaseUrl;

  if (!/^postgres(ql)?:\/\//.test(databaseUrl) || isPlaceholderDatabaseUrl(databaseUrl)) {
    fail([
      'Cognis needs a real PostgreSQL DATABASE_URL.',
      '',
      'Run one of these:',
      '  npm run setup:db -- "postgresql://USER:PASSWORD@POOLER_HOST:6543/DATABASE?pgbouncer=true" --direct-url="postgresql://USER:PASSWORD@POOLER_HOST:5432/DATABASE"',
      '  $env:COGNIS_DATABASE_URL="postgresql://USER:PASSWORD@POOLER_HOST:6543/DATABASE?pgbouncer=true"; $env:COGNIS_DIRECT_URL="postgresql://USER:PASSWORD@POOLER_HOST:5432/DATABASE"; npm run setup:db',
    ].join('\n'));
  }

  if (!/^postgres(ql)?:\/\//.test(directUrl) || isPlaceholderDatabaseUrl(directUrl)) {
    fail('Cognis needs a real PostgreSQL DIRECT_URL for Prisma migrations.');
  }

  return { databaseUrl, directUrl };
}

function setEnvLine(contents, key, value) {
  const line = `${key}="${value.replace(/"/g, '\\"')}"`;
  return contents.match(new RegExp(`^${key}=.*$`, 'm'))
    ? contents.replace(new RegExp(`^${key}=.*$`, 'm'), line)
    : `${contents.replace(/\s*$/, '')}${contents.trim() ? '\n' : ''}${line}\n`;
}

function writeEnv({ databaseUrl, directUrl }) {
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const next = setEnvLine(setEnvLine(existing, 'DATABASE_URL', databaseUrl), 'DIRECT_URL', directUrl);

  fs.writeFileSync(envPath, next);
  console.log('Updated .env database connection settings.');
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

const databaseUrls = resolveDatabaseUrls();
assertPostgresSchema();
writeEnv(databaseUrls);

const prismaCli = path.join(root, 'node_modules', 'prisma', 'build', 'index.js');
run(process.execPath, [prismaCli, 'generate']);
run(process.execPath, [prismaCli, 'migrate', 'deploy']);
run(process.execPath, [prismaCli, 'db', 'seed']);

console.log('Cognis PostgreSQL setup complete.');
