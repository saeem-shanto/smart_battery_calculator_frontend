import type { NextConfig } from "next";

const debugBuild = process.env.APP_DEBUG_BUILD === "true";
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

if (process.env.NODE_ENV === "production") {
  if (!apiBase) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required for a production build.");
  }
  if (!apiBase.startsWith("https://")) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must use HTTPS in production.");
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: debugBuild,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
