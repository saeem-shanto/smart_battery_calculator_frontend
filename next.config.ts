import type { NextConfig } from "next";

const debugBuild = process.env.APP_DEBUG_BUILD === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: debugBuild,
};

export default nextConfig;
