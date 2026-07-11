import type { NextConfig } from "next";

// NOTE: Do NOT set `output: "standalone"` — Vercel uses its own runtime and
// standalone output can cause routing/404 issues there. The default build
// output works correctly on Vercel.
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["*.space-z.ai", "*.chatglm.cn"],
};

export default nextConfig;
