import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite brukes bare lokalt. Disse linjene holder den utenfor pakken som sendes til Vercel.
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingExcludes: {
    "*": ["node_modules/@electric-sql/pglite/**"],
  },
};

export default nextConfig;
