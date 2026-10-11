import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mailbox reading (IMAP) and parsing use Node-only packages that must not be bundled.
  serverExternalPackages: ["imapflow", "mailparser"],
  // The mock upload sends a Word file through a server action: allow a few MB (the default is 1 MB).
  experimental: { serverActions: { bodySizeLimit: "24mb" } },
};

export default nextConfig;
