import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Corrigido: aponto para o arquivo de configuração real
const withNextIntl = createNextIntlPlugin('./next-intl.config.ts');

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
      {
        protocol: "https",
        hostname: "marketup.com"
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      }
    ],
  },
};

export default withNextIntl(nextConfig);
