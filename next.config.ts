import type { NextConfig } from "next";

// Logged-in pages are different for every user, so we keep Next.js's
// advanced page caching off. Every page is built fresh for each request.
const nextConfig: NextConfig = {};

export default nextConfig;
