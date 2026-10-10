import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The mock upload sends a Word file through a server action: allow a few MB (the default is 1 MB).
  experimental: { serverActions: { bodySizeLimit: "24mb" } },
};

export default nextConfig;
