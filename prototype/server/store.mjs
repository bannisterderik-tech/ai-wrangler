import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './config.mjs';
import { decrypt, encrypt } from './crypto-vault.mjs';

const FILE = join(config.dataDir, 'vault.json');

function empty() {
  return { customers: {}, oauth: {}, operator: null, audit: [] };
}

function load() {
  if (!existsSync(FILE)) return empty();
  try {
    return { ...empty(), ...JSON.parse(readFileSync(FILE, 'utf8')) };
  } catch {
    return empty();
  }
}

function save(db) {
  mkdirSync(config.dataDir, { recursive: true });
  const tmp = FILE + '.tmp';
  writeFileSync(tmp, JSON.stringify(db, null, 2));
  renameSync(tmp, FILE);
}

export function slug(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'customer';
}

export function ensureCustomer(id, name) {
  const db = load();
  const cid = slug(id);
  if (!db.customers[cid]) {
    db.customers[cid] = {
      id: cid,
      name: name || id,
      createdAt: Date.now(),
      vercel: null,
      boundProjectIds: [],
      boundProjects: [],
    };
    save(db);
  } else if (name && db.customers[cid].name !== name) {
    db.customers[cid].name = name;
    save(db);
  }
  return publicCustomer(db.customers[cid]);
}

export function listCustomers() {
  const db = load();
  return Object.values(db.customers).map(publicCustomer);
}

export function getCustomer(id) {
  const db = load();
  const row = db.customers[slug(id)];
  return row ? publicCustomer(row) : null;
}

export function publicCustomer(row) {
  const v = row.vercel || null;
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    boundProjectIds: row.boundProjectIds || [],
    boundProjects: row.boundProjects || [],
    vercel: v
      ? {
          connected: true,
          mode: v.mode,
          teamId: v.teamId || null,
          teamName: v.teamName || null,
          configurationId: v.configurationId || null,
          user: v.user || null,
          tokenPrefix: v.tokenPrefix || null,
          connectedAt: v.connectedAt,
          expiresAt: v.expiresAt || null,
        }
      : { connected: false },
  };
}

export function putOAuthState(id, payload) {
  const db = load();
  db.oauth[id] = { ...payload, createdAt: Date.now() };
  for (const [k, v] of Object.entries(db.oauth)) {
    if (Date.now() - v.createdAt > 15 * 60 * 1000) delete db.oauth[k];
  }
  save(db);
}

export function takeOAuthState(id) {
  const db = load();
  const row = db.oauth[id];
  if (!row) return null;
  delete db.oauth[id];
  save(db);
  if (Date.now() - row.createdAt > 15 * 60 * 1000) return null;
  return row;
}

export function setVercelConnection(customerId, conn) {
  const db = load();
  const cid = slug(customerId);
  if (!db.customers[cid]) ensureCustomer(cid, customerId);
  const fresh = load();
  fresh.customers[cid].vercel = conn;
  save(fresh);
  return publicCustomer(fresh.customers[cid]);
}

export function bindProjects(customerId, projects) {
  const db = load();
  const cid = slug(customerId);
  const row = db.customers[cid];
  if (!row) throw new Error('unknown customer');
  const ids = [...new Set(projects.map((p) => p.id))];
  row.boundProjectIds = ids;
  row.boundProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    framework: p.framework || null,
    url: p.url || null,
  }));
  save(db);
  return publicCustomer(row);
}

export function clearVercel(customerId) {
  const db = load();
  const cid = slug(customerId);
  const row = db.customers[cid];
  if (!row) return null;
  row.vercel = null;
  row.boundProjectIds = [];
  row.boundProjects = [];
  save(db);
  return publicCustomer(row);
}

export function getRawVercel(customerId) {
  const db = load();
  return db.customers[slug(customerId)]?.vercel || null;
}

export function decryptTokens(customerId) {
  const raw = getRawVercel(customerId);
  if (!raw) return null;
  return {
    accessToken: decrypt(raw.accessToken),
    refreshToken: raw.refreshToken ? decrypt(raw.refreshToken) : null,
    teamId: raw.teamId || null,
    configurationId: raw.configurationId || null,
    mode: raw.mode,
    expiresAt: raw.expiresAt || null,
  };
}

export function encryptTokens({ accessToken, refreshToken, mode, teamId, teamName, configurationId, user, expiresAt, tokenPrefix }) {
  return {
    mode,
    accessToken: encrypt(accessToken),
    refreshToken: refreshToken ? encrypt(refreshToken) : null,
    teamId: teamId || null,
    teamName: teamName || null,
    configurationId: configurationId || null,
    user: user || null,
    expiresAt: expiresAt || null,
    tokenPrefix: tokenPrefix || null,
    connectedAt: Date.now(),
  };
}

export function audit(entry) {
  const db = load();
  db.audit.unshift({ t: Date.now(), ...entry });
  db.audit = db.audit.slice(0, 500);
  save(db);
}

export function listAudit(customerId) {
  const db = load();
  if (!customerId) return db.audit.slice(0, 80);
  return db.audit.filter((a) => a.customerId === slug(customerId)).slice(0, 80);
}

export { encrypt, decrypt };
