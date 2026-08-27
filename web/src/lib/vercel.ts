import { and, eq } from "drizzle-orm";
import { decrypt } from "./crypto";
import { db } from "./db";
import { IsolationError } from "./isolation";
import { connections } from "./schema";

const API = "https://api.vercel.com";

/** One token per customer. There is no agency-wide Vercel token, on purpose. */
export async function customerVercelToken(customerId: string) {
  const [row] = await db
    .select()
    .from(connections)
    .where(and(eq(connections.customerId, customerId), eq(connections.provider, "vercel")))
    .limit(1);
  if (!row) {
    throw new IsolationError(
      `no Vercel connection for customer ${customerId} — connect their token first`,
      409,
    );
  }
  return { token: decrypt(row.encryptedAccess), teamId: row.teamId };
}

export type VercelProject = { id: string; name: string; framework?: string | null };

export async function listCustomerProjects(customerId: string): Promise<VercelProject[]> {
  const { token, teamId } = await customerVercelToken(customerId);
  const url = new URL(`${API}/v9/projects`);
  url.searchParams.set("limit", "100");
  if (teamId) url.searchParams.set("teamId", teamId);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new IsolationError(data.error?.message || `vercel ${res.status}`, res.status);
  }
  return (data.projects || []).map((p: { id: string; name: string; framework?: string }) => ({
    id: p.id,
    name: p.name,
    framework: p.framework ?? null,
  }));
}
