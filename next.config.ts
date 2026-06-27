import type { NextConfig } from "next";

const BACKEND_PROXY_URL =
  process.env.BACKEND_PROXY_URL ?? "https://back-liart-psi.vercel.app";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_PROXY_URL.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
