import path from "node:path";
import type { NextConfig } from "next";

/**
 * Two deploy targets, and one thing that has to be true on both: the file trace
 * has to land in `web/.next/`.
 *
 * There is a package.json at the repo root — it only proxies npm scripts — which
 * is enough for Next to treat `web/` as a workspace member and anchor output file
 * tracing one directory up. Vercel's onBuildComplete then opens
 * `web/.next/next-server.js.nft.json`, does not find it, and the deploy fails with
 * an ENOENT that says nothing about workspaces. Pinning the tracing root to this
 * directory removes the guesswork.
 *
 * `output: "standalone"` is what Railway wants: a self-contained server bundle
 * that runs anywhere Node runs, which is what the job runner needs. Vercel builds
 * its own output and applies its own config on top, so we do not ask for a second
 * one there.
 */
const onVercel = Boolean(process.env.VERCEL);
const appDir = path.dirname(new URL(import.meta.url).pathname);

const nextConfig: NextConfig = {
  outputFileTracingRoot: appDir,
  turbopack: { root: appDir },
  ...(onVercel ? {} : { output: "standalone" as const }),
};

export default nextConfig;
