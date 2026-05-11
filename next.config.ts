import type { NextConfig } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const allowedOrigins = appUrl
  ? [new URL(appUrl).host, "localhost:3000"]
  : ["localhost:3000"];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

export default nextConfig;
