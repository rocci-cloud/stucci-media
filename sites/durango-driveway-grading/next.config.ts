import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives in a subdirectory of a repo that also contains an unrelated
  // Next.js site. Without pinning the root, Turbopack walks up to the parent
  // lockfile and pulls in that project's proxy.ts and dependencies.
  turbopack: { root: path.resolve(process.cwd()) },

  images: {
    // Project photography is migrated into /public during the rebuild, but the
    // WordPress origin stays reachable while the old site is still live so a
    // half-migrated asset renders instead of 404ing during the cutover window.
    remotePatterns: [
      { protocol: "https", hostname: "durangodrivewaygrading.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async redirects() {
    // Every URL the old site published gets a destination. These are the
    // routes whose paths changed; unchanged paths need no entry.
    return [
      { source: "/request-driveway-evaluation", destination: "/request-consultation", permanent: true },
      { source: "/evaluate-driveways", destination: "/how-i-evaluate-driveways", permanent: true },
      { source: "/transformation-driveway-bayfield-co", destination: "/projects/bayfield-driveway-transformation", permanent: true },
      { source: "/same-night-commercial-snow-removal-star-plaza", destination: "/projects/star-plaza-commercial-snow-removal", permanent: true },
      { source: "/terms-of-use-disclaimer", destination: "/terms", permanent: true },
      // Elementor dropdown containers that never held content of their own.
      { source: "/all-services", destination: "/services", permanent: true },
      { source: "/explore", destination: "/projects", permanent: true },
      { source: "/company", destination: "/about", permanent: true },
    ];
  },
};

export default nextConfig;
