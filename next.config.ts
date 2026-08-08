import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Article covers, OG images, and category/banner uploads all live in
    // Vercel Blob, on a per-project store subdomain — wildcard covers any
    // store id without needing to hardcode this project's specific one.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
