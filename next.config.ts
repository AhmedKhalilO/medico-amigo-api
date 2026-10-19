import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Modules natifs : à ne pas empaqueter, chargés tels quels côté serveur.
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;