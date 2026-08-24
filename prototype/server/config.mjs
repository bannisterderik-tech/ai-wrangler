import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadDotenv() {
  const file = join(root, '.env');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadDotenv();

function requiredHexKey() {
  const raw = process.env.TOKEN_ENCRYPTION_KEY || '';
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  // Dev fallback — tokens won't survive a restart with a new random key.
  const generated = randomBytes(32);
  process.env.TOKEN_ENCRYPTION_KEY = generated.toString('hex');
  console.warn('[ai-wrangler] TOKEN_ENCRYPTION_KEY missing; generated an ephemeral key for this process.');
  return generated;
}

export const config = {
  root,
  port: Number(process.env.PORT || 8899),
  origin: (process.env.APP_ORIGIN || `http://127.0.0.1:${process.env.PORT || 8899}`).replace(/\/$/, ''),
  dataDir: join(root, 'data'),
  workspacesDir: join(root, 'workspaces'),
  encryptionKey: requiredHexKey(),
  integration: {
    clientId: process.env.VERCEL_INTEGRATION_CLIENT_ID || '',
    clientSecret: process.env.VERCEL_INTEGRATION_CLIENT_SECRET || '',
    slug: process.env.VERCEL_INTEGRATION_SLUG || '',
    callbackPath: '/api/auth/vercel/callback',
  },
  signin: {
    clientId: process.env.VERCEL_APP_CLIENT_ID || '',
    clientSecret: process.env.VERCEL_APP_CLIENT_SECRET || '',
    callbackPath: '/api/auth/signin/callback',
  },
  webhookSecret: process.env.VERCEL_WEBHOOK_SECRET || '',
};

export function callbackUrl(path) {
  return `${config.origin}${path}`;
}
