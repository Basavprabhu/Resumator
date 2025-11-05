import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // ✅ disables lint errors in Vercel builds
  },

};

export default nextConfig;
