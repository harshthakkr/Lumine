import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Optimize static assets for production
  compress: true,
  // Ensure proper handling of static files
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
