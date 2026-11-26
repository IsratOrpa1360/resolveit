import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every signed-in page is private and rendered per request, so page caching is off.
  experimental: {
    // Vercel rejects request bodies above 4.5 MB; files are limited to 3 MB.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
