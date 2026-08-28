import { eq } from "drizzle-orm";
import { db } from "./db";
import { decrypt, encrypt } from "./crypto";
import { agencyConnections } from "./schema";

/**
 * Railway, driven from here.
 *
 * The point is that nobody opens the Railway dashboard to add an agent. Minting
 * an agent token provisions or updates the worker service and redeploys it.
 *
 * One thing genuinely cannot be automated away: somebody has to create the
 * Railway API token once, on railway.com, because that is the credential this
 * uses to act. After that, never again.
 *
 * Isolation is per token, not per container, so this does NOT make a service per
 * agent. There is one worker holding a list of agent tokens; each pass runs as
 * exactly one of them and the server hands it exactly one customer.
 */

const API = "https://backboard.railway.com/graphql/v2";
const PROVIDER = "railway";
const TOKENS_VAR = "WRANGLER_SESSION_TOKENS";

export type RailwayState = {
  connected: boolean;
  serviceId: string | null;
  projectId: string | null;
  environmentId: string | null;
  /** Why it cannot act, in words a human can use. */
  blocked?: string;
};

function ids() {
  // Railway injects these into every service it runs, so the OS knows where it
  // lives without being told.
  return {
    projectId: process.env.RAILWAY_PROJECT_ID || null,
    environmentId: process.env.RAILWAY_ENVIRONMENT_ID || null,
  };
}

async function stored() {
  const [row] = await db.select().from(agencyConnections).where(eq(agencyConnections.provider, PROVIDER)).limit(1);
  if (!row) return null;
  return {
    token: decrypt(row.encryptedAccess),
    meta: row.userJson ? (JSON.parse(row.userJson) as { serviceId?: string }) : {},
  };
}

export async function railwayState(): Promise<RailwayState> {
  const { projectId, environmentId } = ids();
  const conn = await stored().catch(() => null);
  const base = { serviceId: conn?.meta.serviceId ?? null, projectId, environmentId };
  if (!conn) return { connected: false, ...base, blocked: "No Railway API token saved yet." };
  if (!projectId || !environmentId) {
    return {
      connected: false,
      ...base,
      blocked: "This is not running on Railway, so there is no project to deploy into.",
    };
  }
  return { connected: true, ...base };
}

async function gql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Railway API ${res.status}: ${JSON.stringify(body)?.slice(0, 300)}`);
  if (body?.errors?.length) throw new Error(`Railway: ${body.errors[0].message}`);
  return body.data as T;
}

/** Save the API token. Encrypted in the same vault as every customer credential. */
export async function connectRailway(apiToken: string) {
  const { projectId, environmentId } = ids();
  if (!projectId || !environmentId) {
    throw new Error("This deploy is not on Railway — RAILWAY_PROJECT_ID is not set.");
  }
  // Prove the token works before storing it, so a typo fails here and not later
  // in the middle of creating an agent.
  await gql(apiToken, `query variables($projectId: String!, $environmentId: String!) {
    variables(projectId: $projectId, environmentId: $environmentId)
  }`, { projectId, environmentId });

  const existing = await stored().catch(() => null);
  const row = {
    provider: PROVIDER,
    mode: "api-token",
    encryptedAccess: encrypt(apiToken),
    userJson: JSON.stringify({ serviceId: existing?.meta.serviceId ?? null }),
    connectedAt: new Date(),
  };
  await db.insert(agencyConnections).values(row).onConflictDoUpdate({
    target: agencyConnections.provider,
    set: { encryptedAccess: row.encryptedAccess, mode: row.mode, connectedAt: row.connectedAt },
  });
  return { ok: true };
}

async function rememberService(serviceId: string) {
  const conn = await stored();
  await db
    .update(agencyConnections)
    .set({ userJson: JSON.stringify({ ...(conn?.meta ?? {}), serviceId }) })
    .where(eq(agencyConnections.provider, PROVIDER));
}

async function readTokens(token: string, projectId: string, environmentId: string, serviceId: string) {
  const data = await gql<{ variables: Record<string, string> }>(
    token,
    `query variables($projectId: String!, $environmentId: String!, $serviceId: String) {
       variables(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId)
     }`,
    { projectId, environmentId, serviceId },
  );
  return String(data.variables?.[TOKENS_VAR] || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

async function writeTokens(
  token: string,
  projectId: string,
  environmentId: string,
  serviceId: string,
  tokens: string[],
) {
  await gql(
    token,
    `mutation variableUpsert($input: VariableUpsertInput!) { variableUpsert(input: $input) }`,
    {
      input: {
        projectId,
        environmentId,
        serviceId,
        name: TOKENS_VAR,
        value: tokens.join(","),
        // We redeploy once, deliberately, after the write.
        skipDeploys: true,
      },
    },
  );
  await gql(
    token,
    `mutation serviceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
       serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
     }`,
    { serviceId, environmentId },
  );
}

/**
 * Give the worker one more agent to run as. Creates the worker the first time,
 * with the root directory and every variable it needs, so there is nothing to
 * click.
 */
export async function attachAgent(agentToken: string, repo: string, origin: string) {
  const state = await railwayState();
  if (!state.connected) return { deployed: false as const, why: state.blocked ?? "Railway is not connected." };

  const conn = await stored();
  if (!conn) return { deployed: false as const, why: "Railway is not connected." };
  const { projectId, environmentId } = state as { projectId: string; environmentId: string };
  const anthropic = process.env.ANTHROPIC_API_KEY;
  if (!anthropic) {
    return { deployed: false as const, why: "ANTHROPIC_API_KEY is not set on this service, so the agent could not think." };
  }

  if (!state.serviceId) {
    const made = await gql<{ serviceCreate: { id: string; name: string } }>(
      conn.token,
      `mutation serviceCreate($input: ServiceCreateInput!) { serviceCreate(input: $input) { id name } }`,
      {
        input: {
          projectId,
          name: "ai-wrangler-agents",
          source: { repo },
          rootDirectory: "worker",
          variables: {
            ANTHROPIC_API_KEY: anthropic,
            WRANGLER_MCP_URL: `${origin}/api/mcp`,
            [TOKENS_VAR]: agentToken,
          },
        },
      },
    );
    await rememberService(made.serviceCreate.id);
    return { deployed: true as const, created: true, serviceId: made.serviceCreate.id };
  }

  const tokens = await readTokens(conn.token, projectId, environmentId, state.serviceId);
  if (!tokens.includes(agentToken)) tokens.push(agentToken);
  await writeTokens(conn.token, projectId, environmentId, state.serviceId, tokens);
  return { deployed: true as const, created: false, serviceId: state.serviceId, agents: tokens.length };
}
