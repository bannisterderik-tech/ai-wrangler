import { NextResponse } from "next/server";
import { IsolationError } from "@/lib/isolation";
import { callTool, ToolError, toolsFor } from "@/lib/mcp-tools";
import {
  PLATFORM_TOOLS,
  PLATFORM_TOOL_NAMES,
  PlatformError,
  callPlatformTool,
  mayUsePlatform,
} from "@/lib/mcp-platform";
import { sessionFromHeader, touchSession, type McpSession } from "@/lib/session-token";

/**
 * The MCP server. This is the thing a teammate's Claude Code connects to:
 *
 *   claude mcp add wrangler --transport http https://<host>/api/mcp \
 *     --header "Authorization: Bearer wr_sess_..."
 *
 * Streamable HTTP: one POST per JSON-RPC message, one JSON response back.
 * The Bearer token identifies the person, and their scope and tool grants are
 * enforced on every call in mcp-tools.ts — not in a system prompt.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26"];
const SERVER = { name: "ai-wrangler", version: "1.0.0" };

type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

const err = (id: Rpc["id"], code: number, message: string, status = 200) =>
  NextResponse.json(
    { jsonrpc: "2.0", id: id ?? null, error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );

function unauthorized() {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: null,
      error: { code: -32001, message: "Unknown or revoked session token. Ask the operator for a fresh one." },
    },
    {
      status: 401,
      headers: { "WWW-Authenticate": 'Bearer realm="ai-wrangler"', "Cache-Control": "no-store" },
    },
  );
}

export async function POST(req: Request) {
  let session: McpSession | null;
  try {
    session = await sessionFromHeader(req.headers.get("authorization"));
  } catch {
    return err(null, -32603, "session lookup failed", 500);
  }
  if (!session) return unauthorized();

  let body: Rpc | Rpc[];
  try {
    body = (await req.json()) as Rpc | Rpc[];
  } catch {
    return err(null, -32700, "parse error", 400);
  }

  // A batch is legal JSON-RPC. Notifications inside it produce no reply.
  if (Array.isArray(body)) {
    const replies = [];
    for (const one of body) {
      const res = await handle(one, session);
      if (res) replies.push(res);
    }
    return NextResponse.json(replies, { headers: { "Cache-Control": "no-store" } });
  }

  const res = await handle(body, session);
  // Notification: nothing to say back.
  if (!res) return new NextResponse(null, { status: 202 });
  return NextResponse.json(res, { headers: { "Cache-Control": "no-store" } });
}

async function handle(msg: Rpc, session: McpSession): Promise<Record<string, unknown> | null> {
  const { id, method, params } = msg;
  const isNotification = id === undefined || id === null;
  const reply = (result: unknown) => ({ jsonrpc: "2.0", id, result });
  const fail = (code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

  switch (method) {
    case "initialize": {
      const asked = String((params?.protocolVersion as string) || "");
      const clientInfo = params?.clientInfo as { name?: string; version?: string } | undefined;
      await touchSession(session.id, clientInfo?.version ? `${clientInfo.name ?? "client"} ${clientInfo.version}` : null);
      return reply({
        protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER,
        instructions: [
          `You are ${session.name}'s session on the AI Wrangler floor.`,
          `Scoped customers: ${session.scope.join(", ") || "none yet"}.`,
          "Call list_jobs first. Claim a job before you write anything.",
          "Never write to main and never send to a real person — use request_approval and stop.",
        ].join(" "),
      });
    }

    case "notifications/initialized":
    case "notifications/cancelled":
      return null;

    case "ping":
      return isNotification ? null : reply({});

    case "tools/list": {
      // The build tools work one customer's repository; the platform tools work
      // the agency itself. Both are still filtered by what this session was
      // granted, so connecting a Claude Code does not widen anything.
      const platform = mayUsePlatform(session)
        ? PLATFORM_TOOLS.filter((t) => session.tools.includes(t.name))
        : [];
      return reply({ tools: [...toolsFor(session), ...platform].map((t) => ({ ...t })) });
    }

    case "tools/call": {
      const name = String(params?.name || "");
      const args = (params?.arguments as Record<string, unknown>) || {};
      if (!name) return fail(-32602, "tools/call requires a name");
      try {
        const text = PLATFORM_TOOL_NAMES.includes(name)
          ? await (async () => {
              if (!mayUsePlatform(session)) {
                throw new PlatformError("refused: the platform tools are for people, not for build agents.");
              }
              if (!session.tools.includes(name)) {
                throw new PlatformError(`refused: this session was not granted ${name}.`);
              }
              return callPlatformTool(session, name, args);
            })()
          : await callTool(session, name, args);
        return reply({ content: [{ type: "text", text }], isError: false });
      } catch (e) {
        // Refusals and wall hits are results, so the model can read them and
        // change course rather than seeing an opaque transport error.
        if (e instanceof ToolError || e instanceof PlatformError || e instanceof IsolationError) {
          return reply({ content: [{ type: "text", text: (e as Error).message }], isError: true });
        }
        console.error("[wrangler mcp]", e);
        return reply({
          content: [{ type: "text", text: "The floor errored on that call. A human has the log." }],
          isError: true,
        });
      }
    }

    case "resources/list":
      return reply({ resources: [] });
    case "prompts/list":
      return reply({ prompts: [] });

    default:
      return isNotification ? null : fail(-32601, `method not found: ${method}`);
  }
}

/** Some clients probe with GET before opening a stream. Say what this is. */
export async function GET(req: Request) {
  const session = await sessionFromHeader(req.headers.get("authorization"));
  if (!session) return unauthorized();
  return NextResponse.json(
    {
      server: SERVER,
      transport: "streamable-http",
      session: { name: session.name, handle: session.handle },
      scope: session.scope,
      tools: toolsFor(session).map((t) => t.name),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
