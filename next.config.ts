import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/photo-**" }],
  },
  async redirects() {
    return [
      // Category pages from the original static site now live in search.
      // Old account URLs from before the bookings/saved split.
      { source: "/account", destination: "/bookings", permanent: true },
      { source: "/account/bookings/:reference", destination: "/bookings/:reference", permanent: true },
      {
        source: "/categories/:category",
        destination: "/artists?category=:category",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
