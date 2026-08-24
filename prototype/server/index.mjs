import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { config } from './config.mjs';
import { IsolationError } from './isolation.mjs';
import {
  audit,
  clearVercel,
  ensureCustomer,
  getCustomer,
  listAudit,
  listCustomers,
  slug,
} from './store.mjs';
import {
  connectWithPat,
  finishIntegrationOAuth,
  startIntegrationOAuth,
  startSigninOAuth,
} from './oauth.mjs';
import {
  bindCustomerProjects,
  createDeployment,
  listDeployments,
  listProjects,
  rollback,
} from './vercel.mjs';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function send(res, status, body, headers = {}) {
  const payload = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': typeof body === 'object' && !Buffer.isBuffer(body) ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(payload);
}

function json(res, status, body) {
  send(res, status, body, { 'Content-Type': 'application/json; charset=utf-8' });
}

function redirect(res, location) {
  res.writeHead(302, { Location: location, 'Cache-Control': 'no-store' });
  res.end();
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return Object.fromEntries(new URLSearchParams(raw));
  }
}

function customerIdFrom(url) {
  const m = url.pathname.match(/^\/api\/customers\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function handleApi(req, res, url) {
  const path = url.pathname;
  const method = req.method || 'GET';

  if (path === '/api/health') {
    return json(res, 200, {
      ok: true,
      integration: Boolean(config.integration.clientId && config.integration.slug),
      signin: Boolean(config.signin.clientId),
    });
  }

  if (path === '/api/customers' && method === 'GET') {
    return json(res, 200, { customers: listCustomers() });
  }

  if (path === '/api/customers' && method === 'POST') {
    const body = await readBody(req);
    const row = ensureCustomer(body.id || body.name, body.name);
    return json(res, 200, row);
  }

  if (path === '/api/audit' && method === 'GET') {
    return json(res, 200, { audit: listAudit(url.searchParams.get('customer')) });
  }

  if (path === '/api/auth/vercel/start' && method === 'GET') {
    const customerId = slug(url.searchParams.get('customerId') || url.searchParams.get('customer') || 'new-customer');
    const name = url.searchParams.get('name') || customerId;
    const { url: loc } = startIntegrationOAuth(customerId, name);
    return redirect(res, loc);
  }

  if (path === '/api/auth/vercel/callback' && method === 'GET') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const teamId = url.searchParams.get('teamId');
    const configurationId = url.searchParams.get('configurationId');
    const next = url.searchParams.get('next');
    if (!code || !state) return redirect(res, '/connect.html?error=missing_code');
    const done = await finishIntegrationOAuth({ code, state, teamId, configurationId, next });
    return redirect(res, done.next);
  }

  if (path === '/api/auth/signin/start' && method === 'GET') {
    const { url: loc } = startSigninOAuth();
    return redirect(res, loc);
  }

  if (path === '/api/auth/signin/callback' && method === 'GET') {
    return redirect(res, '/connect.html');
  }

  const cid = customerIdFrom(url);
  if (cid) {
    if (method === 'GET' && path === `/api/customers/${cid}`) {
      const row = getCustomer(cid) || ensureCustomer(cid, cid);
      return json(res, 200, row);
    }
    if (method === 'GET' && path === `/api/customers/${cid}/vercel/status`) {
      const row = getCustomer(cid) || ensureCustomer(cid, cid);
      return json(res, 200, row);
    }
    if (method === 'POST' && path === `/api/customers/${cid}/vercel/token`) {
      const body = await readBody(req);
      const row = await connectWithPat(cid, body);
      return json(res, 200, getCustomer(cid) || row);
    }
    if (method === 'POST' && path === `/api/customers/${cid}/vercel/disconnect`) {
      const row = clearVercel(cid);
      audit({ customerId: cid, actor: 'you', action: 'disconnected vercel', target: cid });
      return json(res, 200, row || { ok: true });
    }
    if (method === 'GET' && path === `/api/customers/${cid}/vercel/projects`) {
      const projects = await listProjects(cid);
      return json(res, 200, { projects, customer: getCustomer(cid) });
    }
    if (method === 'POST' && path === `/api/customers/${cid}/vercel/bind`) {
      const body = await readBody(req);
      const ids = body.projectIds || body.projects || [];
      const row = await bindCustomerProjects(cid, ids);
      return json(res, 200, row);
    }
    if (method === 'GET' && path === `/api/customers/${cid}/vercel/deployments`) {
      const projectId = url.searchParams.get('projectId');
      const deployments = await listDeployments(cid, projectId);
      return json(res, 200, { deployments });
    }
    if (method === 'POST' && path === `/api/customers/${cid}/vercel/deploy`) {
      const body = await readBody(req);
      const deployment = await createDeployment(cid, body);
      return json(res, 200, { deployment });
    }
    if (method === 'POST' && path === `/api/customers/${cid}/vercel/rollback`) {
      const body = await readBody(req);
      const result = await rollback(cid, body);
      return json(res, 200, { result });
    }
  }

  json(res, 404, { error: 'not found' });
}

function safeStatic(rel) {
  const dest = normalize(join(config.root, rel));
  const root = config.root.endsWith(sep) ? config.root : config.root + sep;
  if (dest !== config.root && !dest.startsWith(root)) return null;
  if (!existsSync(dest) || !statSync(dest).isFile()) return null;
  return dest;
}

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const file = safeStatic(rel.replace(/^\//, ''));
  if (!file) {
    send(res, 404, 'not found', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }
  const type = MIME[extname(file)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  createReadStream(file).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', config.origin);
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
      return;
    }
    serveStatic(req, res, url);
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || 'internal error';
    if (urlLooksHtml(req)) {
      redirect(res, `/connect.html?error=${encodeURIComponent(message)}`);
      return;
    }
    json(res, status, { error: message, code: err.name || 'Error' });
  }
});

function urlLooksHtml(req) {
  const path = req.url || '';
  return path.startsWith('/api/auth/');
}

server.listen(config.port, '127.0.0.1', () => {
  console.log(`AI Wrangler → ${config.origin}`);
  console.log(`Vercel integration OAuth: ${config.integration.clientId ? 'configured' : 'NOT SET — use a project-scoped token to start'}`);
});
