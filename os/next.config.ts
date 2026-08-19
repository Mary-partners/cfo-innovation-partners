import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Type-checking is run as its own CI step (`npm run typecheck`).
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
