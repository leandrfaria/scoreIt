import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "i.scdn.co", 
      },
    ],
    domains: ["image.tmdb.org", "i.scdn.co"], 
  },
};

export default nextConfig;
