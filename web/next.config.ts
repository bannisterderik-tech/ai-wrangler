import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle: runs anywhere Node runs (Railway, Fly, a VPS).
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
