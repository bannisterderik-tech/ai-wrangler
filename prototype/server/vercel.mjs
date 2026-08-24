import { tenantQuery, IsolationError, assertBoundProject } from './isolation.mjs';
import { audit, bindProjects, decryptTokens, getCustomer, setVercelConnection, encryptTokens } from './store.mjs';
import { hashTokenPrefix } from './crypto-vault.mjs';
import { config, callbackUrl } from './config.mjs';

const API = 'https://api.vercel.com';

async function readJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export async function vercelFetch(tokens, path, { method = 'GET', body, query } = {}) {
  const q = tenantQuery(tokens.teamId, query);
  const url = `${API}${path}${q.toString() ? `?${q}` : ''}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await readJson(res);
  if (!res.ok) {
    const err = new IsolationError(data.error?.message || data.message || `vercel ${res.status}`, res.status);
    err.payload = data;
    throw err;
  }
  return data;
}

export async function tokensFor(customerId) {
  const tokens = decryptTokens(customerId);
  if (!tokens?.accessToken) throw new IsolationError('vercel is not connected for this customer', 409);
  if (tokens.refreshToken && tokens.expiresAt && Date.now() > tokens.expiresAt - 60_000) {
    return refreshIfPossible(customerId, tokens);
  }
  return tokens;
}

async function refreshIfPossible(customerId, tokens) {
  if (!tokens.refreshToken || !config.signin.clientId) return tokens;
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.signin.clientId,
    client_secret: config.signin.clientSecret,
    refresh_token: tokens.refreshToken,
  });
  const res = await fetch('https://api.vercel.com/login/oauth/token', { method: 'POST', body: params });
  const data = await readJson(res);
  if (!res.ok) return tokens;
  const customer = getCustomer(customerId);
  setVercelConnection(customerId, encryptTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token || tokens.refreshToken,
    mode: tokens.mode,
    teamId: tokens.teamId,
    teamName: customer?.vercel?.teamName,
    configurationId: tokens.configurationId,
    user: customer?.vercel?.user,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    tokenPrefix: hashTokenPrefix(data.access_token),
  }));
  return decryptTokens(customerId);
}

export async function listProjects(customerId) {
  const tokens = await tokensFor(customerId);
  const data = await vercelFetch(tokens, '/v9/projects', { query: { limit: '100' } });
  const projects = (data.projects || []).map((p) => ({
    id: p.id,
    name: p.name,
    framework: p.framework || null,
    url: p.targets?.production?.alias?.[0] || (p.name ? `${p.name}.vercel.app` : null),
    updatedAt: p.updatedAt,
  }));
  audit({ customerId, actor: 'system', action: 'listed vercel projects', target: `${projects.length} projects` });
  return projects;
}

export async function bindCustomerProjects(customerId, projectIds) {
  const customer = getCustomer(customerId);
  if (!customer) throw new IsolationError('unknown customer', 404);
  const all = await listProjects(customerId);
  const wanted = new Set(projectIds);
  const picked = all.filter((p) => wanted.has(p.id));
  if (picked.length !== wanted.size) {
    throw new IsolationError('one or more project ids are not visible to this customer token', 403);
  }
  const bound = bindProjects(customerId, picked);
  audit({ customerId, actor: 'you', action: 'bound vercel projects', target: picked.map((p) => p.name).join(', ') });
  return bound;
}

export async function listDeployments(customerId, projectId) {
  const customer = getCustomer(customerId);
  assertBoundProject(customer, projectId);
  const tokens = await tokensFor(customerId);
  const data = await vercelFetch(tokens, '/v6/deployments', { query: { projectId, limit: '20' } });
  audit({ customerId, actor: 'system', action: 'listed deployments', target: projectId });
  return (data.deployments || []).map((d) => ({
    id: d.uid || d.id,
    url: d.url ? `https://${d.url}` : null,
    state: d.state || d.readyState,
    target: d.target || null,
    createdAt: d.createdAt,
    meta: d.meta || {},
  }));
}

export async function createDeployment(customerId, { projectId, target = 'preview', files, name }) {
  const customer = getCustomer(customerId);
  assertBoundProject(customer, projectId);
  if (target === 'production') {
    // Production always requires an explicit human OK in the OS. The API still
    // allows it — the UI must not call this without an approval gate.
  }
  const tokens = await tokensFor(customerId);
  const project = (customer.boundProjects || []).find((p) => p.id === projectId);
  const body = {
    name: name || project?.name || customer.id,
    project: projectId,
    target: target === 'production' ? 'production' : undefined,
    withCache: true,
  };
  if (files?.length) body.files = files;
  const data = await vercelFetch(tokens, '/v13/deployments', {
    method: 'POST',
    body,
    query: { forceNew: '1' },
  });
  audit({
    customerId,
    actor: 'ai-wrangler',
    action: target === 'production' ? 'PRODUCTION deploy' : 'preview deploy',
    target: `${project?.name || projectId} · ${data.id || data.uid || ''}`,
  });
  return {
    id: data.id || data.uid,
    url: data.url ? `https://${data.url}` : null,
    inspectorUrl: data.inspectorUrl || null,
    readyState: data.readyState,
    target: data.target || target,
  };
}

export async function rollback(customerId, { projectId, deploymentId }) {
  const customer = getCustomer(customerId);
  assertBoundProject(customer, projectId);
  if (!deploymentId) throw new IsolationError('deploymentId required', 400);
  const tokens = await tokensFor(customerId);
  const data = await vercelFetch(tokens, `/v13/deployments/${deploymentId}/rollback`, {
    method: 'POST',
    body: {},
  });
  audit({ customerId, actor: 'ai-wrangler', action: 'rollback', target: `${projectId} → ${deploymentId}` });
  return data;
}

export function integrationAuthorizeUrl(state) {
  const { slug } = config.integration;
  if (!slug) throw new IsolationError('VERCEL_INTEGRATION_SLUG is not set', 503);
  return `https://vercel.com/integrations/${encodeURIComponent(slug)}/new?state=${encodeURIComponent(state)}`;
}

export async function exchangeIntegrationCode(code) {
  const { clientId, clientSecret } = config.integration;
  if (!clientId || !clientSecret) throw new IsolationError('Vercel integration credentials are not configured', 503);
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: callbackUrl(config.integration.callbackPath),
  });
  const res = await fetch('https://api.vercel.com/v2/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new IsolationError(data.error_description || data.error || 'token exchange failed', res.status);
  }
  return data;
}

export async function exchangeSigninCode({ code, codeVerifier, redirectUri }) {
  const { clientId, clientSecret } = config.signin;
  if (!clientId || !clientSecret) throw new IsolationError('Sign in with Vercel is not configured', 503);
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
  });
  const res = await fetch('https://api.vercel.com/login/oauth/token', { method: 'POST', body: params });
  const data = await readJson(res);
  if (!res.ok) throw new IsolationError(JSON.stringify(data), res.status);
  return data;
}

export async function vercelUser(accessToken) {
  const res = await fetch('https://api.vercel.com/v2/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return readJson(res);
}

export async function configurationProjects(tokens) {
  if (!tokens.configurationId) return listProjectsFromToken(tokens);
  const data = await vercelFetch(tokens, `/v1/integrations/configurations/${tokens.configurationId}`);
  return data;
}

async function listProjectsFromToken(tokens) {
  const data = await vercelFetch(tokens, '/v9/projects', { query: { limit: '100' } });
  return data.projects || [];
}

export { callbackUrl };
