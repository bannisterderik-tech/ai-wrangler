import { createHash, randomBytes } from 'node:crypto';
import { config, callbackUrl } from './config.mjs';
import { IsolationError } from './isolation.mjs';
import { hashTokenPrefix } from './crypto-vault.mjs';
import {
  audit,
  encryptTokens,
  ensureCustomer,
  putOAuthState,
  setVercelConnection,
  takeOAuthState,
} from './store.mjs';
import { exchangeIntegrationCode, exchangeSigninCode, vercelUser } from './vercel.mjs';

function rand(n = 43) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const bytes = randomBytes(n);
  return Array.from(bytes, (b) => charset[b % charset.length]).join('');
}

export function startIntegrationOAuth(customerId, customerName) {
  if (!config.integration.clientId || !config.integration.slug) {
    throw new IsolationError(
      'Create a Vercel Integration (dashboard → integrations console), then set VERCEL_INTEGRATION_CLIENT_ID / SECRET / SLUG. Until then you can paste a project-scoped token.',
      503,
    );
  }
  const state = rand();
  ensureCustomer(customerId, customerName);
  putOAuthState(state, { kind: 'integration', customerId, customerName });
  const url = `https://vercel.com/integrations/${encodeURIComponent(config.integration.slug)}/new?state=${encodeURIComponent(state)}`;
  return { url, state };
}

export function startSigninOAuth() {
  if (!config.signin.clientId) {
    throw new IsolationError('Sign in with Vercel is not configured (VERCEL_APP_CLIENT_ID).', 503);
  }
  const state = rand();
  const nonce = rand();
  const codeVerifier = randomBytes(43).toString('hex');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  putOAuthState(state, { kind: 'signin', nonce, codeVerifier });
  const q = new URLSearchParams({
    client_id: config.signin.clientId,
    redirect_uri: callbackUrl(config.signin.callbackPath),
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    response_type: 'code',
    scope: 'openid email profile offline_access',
  });
  return { url: `https://vercel.com/oauth/authorize?${q}`, state };
}

export async function finishIntegrationOAuth({ code, state, teamId, configurationId, next }) {
  const saved = takeOAuthState(state);
  if (!saved || saved.kind !== 'integration') throw new IsolationError('invalid or expired oauth state', 400);
  const token = await exchangeIntegrationCode(code);
  const access = token.access_token;
  const user = await vercelUser(access).catch(() => ({}));
  const customer = ensureCustomer(saved.customerId, saved.customerName);
  setVercelConnection(customer.id, encryptTokens({
    accessToken: access,
    refreshToken: token.refresh_token || null,
    mode: 'integration',
    teamId: teamId || token.team_id || null,
    teamName: user?.user?.name || null,
    configurationId: configurationId || token.installation_id || null,
    user: {
      id: user?.user?.uid || user?.user?.id || null,
      username: user?.user?.username || null,
      email: user?.user?.email || null,
    },
    tokenPrefix: hashTokenPrefix(access),
  }));
  audit({
    customerId: customer.id,
    actor: user?.user?.username || 'vercel-oauth',
    action: 'connected vercel via integration oauth',
    target: teamId || 'personal',
  });
  return { customerId: customer.id, next: next || `/connect.html?customer=${encodeURIComponent(customer.id)}` };
}

export async function finishSigninOAuth({ code, state, origin }) {
  const saved = takeOAuthState(state);
  if (!saved || saved.kind !== 'signin') throw new IsolationError('invalid or expired oauth state', 400);
  const tokens = await exchangeSigninCode({
    code,
    codeVerifier: saved.codeVerifier,
    redirectUri: callbackUrl(config.signin.callbackPath),
  });
  const payload = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString('utf8'));
  if (saved.nonce && payload.nonce !== saved.nonce) throw new IsolationError('nonce mismatch', 400);
  return {
    tokens,
    user: {
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      username: payload.preferred_username,
    },
  };
}

export async function connectWithPat(customerId, { token, teamId, name }) {
  if (!token || typeof token !== 'string' || token.length < 12) {
    throw new IsolationError('a Vercel access token is required', 400);
  }
  const customer = ensureCustomer(customerId, name);
  const user = await vercelUser(token);
  if (user.error) throw new IsolationError(user.error.message || 'token was rejected by Vercel', 401);
  setVercelConnection(customer.id, encryptTokens({
    accessToken: token.trim(),
    refreshToken: null,
    mode: 'pat',
    teamId: teamId || null,
    teamName: user?.user?.name || null,
    configurationId: null,
    user: {
      id: user?.user?.uid || user?.user?.id || null,
      username: user?.user?.username || null,
      email: user?.user?.email || null,
    },
    tokenPrefix: hashTokenPrefix(token.trim()),
  }));
  audit({
    customerId: customer.id,
    actor: user?.user?.username || 'pat',
    action: 'connected vercel via project-scoped token',
    target: teamId || 'token-scope',
  });
  return customer;
}
