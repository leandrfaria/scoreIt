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
        hostname: "i.scdn.co", // ✅ adicionado para imagens do Spotify
      },
    ],
    domains: ["image.tmdb.org", "i.scdn.co"], // ✅ ambos os domínios incluídos
  },
};

export default nextConfig;
