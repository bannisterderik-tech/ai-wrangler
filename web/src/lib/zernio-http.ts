/**
 * The one place a Zernio request is actually made.
 *
 * Every generated function funnels through here, so retries, timeouts, error
 * shape and the key all live in one file rather than 647.
 */

const BASE = "https://zernio.com/api";
const KEY = process.env.ZERNIO_API_KEY;

export class ZernioError extends Error {
  status: number;
  /** Zernio's own body, when it sent one. Useful; never shown to a client. */
  detail?: unknown;
  constructor(message: string, status = 502, detail?: unknown) {
    super(message);
    this.name = "ZernioError";
    this.status = status;
    this.detail = detail;
  }
}

export function zernioConfigured() {
  return Boolean(KEY);
}

export type ZernioScalar = string | number | boolean | undefined | null;
export type ZernioQuery = Record<string, ZernioScalar | ZernioScalar[]>;

/**
 * Make the call.
 *
 * Rate limits are retried with a wait, because Zernio sits in front of Google
 * and Meta and both of them throttle; nothing else is retried, because a
 * failed create that quietly happens twice is worse than a failed create.
 */
export async function zernioCall(
  method: string,
  path: string,
  query?: ZernioQuery,
  body?: unknown,
): Promise<Record<string, unknown>> {
  if (!KEY) throw new ZernioError("Zernio is not connected — set ZERNIO_API_KEY.", 503);

  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === null || v === "") continue;
    // An array parameter repeats the key, which is OpenAPI's default `form`
    // style with explode — joining them with a comma would send one wrong value.
    if (Array.isArray(v)) {
      for (const one of v) if (one !== undefined && one !== null && one !== "") url.searchParams.append(k, String(one));
      continue;
    }
    url.searchParams.set(k, String(v));
  }

  const form = body instanceof FormData;
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${KEY}`,
          ...(form || body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : form ? (body as FormData) : JSON.stringify(body),
        signal: AbortSignal.timeout(90_000),
      });
    } catch (e) {
      throw new ZernioError(
        (e as Error).name === "TimeoutError" ? "Zernio did not answer in time." : "Could not reach Zernio.",
      );
    }

    if (res.status === 429 && attempt < 2) {
      const wait = Number(res.headers.get("retry-after")) || 2 * (attempt + 1);
      await new Promise((r) => setTimeout(r, Math.min(wait, 10) * 1000));
      continue;
    }

    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      data = { raw: text.slice(0, 2000) };
    }

    if (res.ok) return data;

    const msg =
      (typeof data.error === "string" && data.error) ||
      (typeof data.message === "string" && data.message) ||
      `Zernio answered ${res.status}`;
    if (res.status === 401) {
      // Ours, not theirs. Never let this read as the customer's problem.
      throw new ZernioError("Zernio rejected our API key.", 502, data);
    }
    if (res.status === 403) {
      throw new ZernioError(`${msg} — this Zernio plan may not include that add-on.`, 403, data);
    }
    throw new ZernioError(msg, res.status, data);
  }
}
