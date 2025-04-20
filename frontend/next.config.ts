import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/routing.ts'); // 👈 precisa bater

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
}
  export default withNextIntl(nextConfig);