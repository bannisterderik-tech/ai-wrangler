import { eq } from "drizzle-orm";
import { db } from "./db";
import { decrypt, encrypt } from "./crypto";
import { agencyConnections } from "./schema";
import { getAgencyKey, saveAgencyKey } from "./keys";

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

export async function anthropicKey() {
  return getAgencyKey("anthropic");
}

export async function saveAnthropicKey(key: string) {
  return saveAgencyKey("anthropic", key);
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

async function gql<T>(token: string, op: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json().catch(() => null);
  // Railway answers an unknown input field with a bare "Problem processing
  // request", so say which call it was or the message is unusable.
  if (!res.ok) throw new Error(`Railway ${op} failed (${res.status}): ${JSON.stringify(body)?.slice(0, 300)}`);
  if (body?.errors?.length) throw new Error(`Railway ${op}: ${body.errors[0].message}`);
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
  await gql(apiToken, "variables", `query variables($projectId: String!, $environmentId: String!) {
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

/** Passing an empty id forgets the worker, so the next mint creates a new one. */
async function rememberService(serviceId: string) {
  const conn = await stored();
  await db
    .update(agencyConnections)
    .set({ userJson: JSON.stringify({ ...(conn?.meta ?? {}), serviceId: serviceId || null }) })
    .where(eq(agencyConnections.provider, PROVIDER));
}

/**
 * Start a deployment. Always deployV2, never redeploy: redeploy repeats a
 * previous deployment, and a service that has never deployed has none to
 * repeat — it simply returns and nothing happens, which is what "minting does
 * nothing" looked like.
 */
async function deploy(token: string, serviceId: string, environmentId: string) {
  await gql(
    token,
    "serviceInstanceDeployV2",
    `mutation serviceInstanceDeployV2($serviceId: String!, $environmentId: String!) {
       serviceInstanceDeployV2(serviceId: $serviceId, environmentId: $environmentId)
     }`,
    { serviceId, environmentId },
  );
}

async function readTokens(token: string, projectId: string, environmentId: string, serviceId: string) {
  const data = await gql<{ variables: Record<string, string> }>(
    token,
    "variables",
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
  // VariableUpsertInput is exactly these five fields. The docs also describe a
  // skipDeploys flag; the schema does not have it, and an unknown field here is
  // a flat 400 rather than a warning — so it is not sent.
  await gql(
    token,
    "variableUpsert",
    `mutation variableUpsert($input: VariableUpsertInput!) { variableUpsert(input: $input) }`,
    { input: { projectId, environmentId, serviceId, name: TOKENS_VAR, value: tokens.join(",") } },
  );
  await deploy(token, serviceId, environmentId);
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
  const anthropic = await anthropicKey();
  if (!anthropic) {
    return {
      deployed: false as const,
      why: "No Anthropic key saved yet — paste one on this screen and the agent gets it.",
    };
  }

  // If a worker was already made by hand, adopt it instead of creating a rival
  // that fights it for the same jobs.
  if (!state.serviceId && process.env.RAILWAY_WORKER_SERVICE_ID) {
    await rememberService(process.env.RAILWAY_WORKER_SERVICE_ID);
    state.serviceId = process.env.RAILWAY_WORKER_SERVICE_ID;
  }

  const create = async () => {
    // ServiceCreateInput does not take a root directory — that lives on the
    // service *instance*. Create, then set it, then deploy, in that order: a
    // build kicked off before the root directory is set builds the repo root,
    // where there is deliberately no app.
    const made = await gql<{ serviceCreate: { id: string; name: string } }>(
      conn.token,
      "serviceCreate",
      `mutation serviceCreate($input: ServiceCreateInput!) { serviceCreate(input: $input) { id name } }`,
      {
        input: {
          projectId,
          environmentId,
          name: "ai-wrangler-agents",
          source: { repo },
          variables: {
            ANTHROPIC_API_KEY: anthropic,
            WRANGLER_MCP_URL: `${origin}/api/mcp`,
            [TOKENS_VAR]: agentToken,
          },
        },
      },
    );
    const serviceId = made.serviceCreate.id;
    await rememberService(serviceId);

    // serviceCreate takes a variables map, but it is a scalar and there is no
    // way to see whether it landed. Set them explicitly as well: a worker that
    // boots without them crash-loops on its own error message.
    for (const [name, value] of [
      ["ANTHROPIC_API_KEY", anthropic],
      ["WRANGLER_MCP_URL", `${origin}/api/mcp`],
      [TOKENS_VAR, agentToken],
    ] as [string, string][]) {
      await gql(
        conn.token,
        `variableUpsert(${name})`,
        `mutation variableUpsert($input: VariableUpsertInput!) { variableUpsert(input: $input) }`,
        { input: { projectId, environmentId, serviceId, name, value } },
      );
    }

    await gql(
      conn.token,
      "serviceInstanceUpdate",
      `mutation serviceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
         serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
       }`,
      { serviceId, environmentId, input: { rootDirectory: "worker" } },
    );

    await deploy(conn.token, serviceId, environmentId);
    return { deployed: true as const, created: true, serviceId };
  };

  if (!state.serviceId) return create();

  try {
    const tokens = await readTokens(conn.token, projectId, environmentId, state.serviceId);
    if (!tokens.includes(agentToken)) tokens.push(agentToken);
    await writeTokens(conn.token, projectId, environmentId, state.serviceId, tokens);
    return { deployed: true as const, created: false, serviceId: state.serviceId, agents: tokens.length };
  } catch (e) {
    // The remembered worker was deleted in the dashboard. Forget it and build a
    // new one in the same click — telling somebody to press the button again is
    // not recovery, it is homework.
    await rememberService("");
    try {
      const made = await create();
      return { ...made, rebuilt: true as const };
    } catch (again) {
      return {
        deployed: false as const,
        why: `The remembered worker was gone (${(e as Error).message}) and building a new one failed: ${(again as Error).message}`,
      };
    }
  }
}
