import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produktbilder sendes til serveren via en server action. Standardgrensen er 1 MB.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // PGlite brukes bare lokalt. Disse linjene holder den utenfor pakken som sendes til Vercel.
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingExcludes: {
    "*": ["node_modules/@electric-sql/pglite/**"],
  },
};

export default nextConfig;
