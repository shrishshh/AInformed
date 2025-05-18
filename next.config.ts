
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      // removed placehold.co as images will be generated data URIs
      // If you add other external image sources, list their hostnames here.
    ],
    // It's good to allow data URIs for next/image if not enabled by default,
    // however, Next.js 13+ typically supports data URIs for src without explicit config.
    // If issues arise, you might need to specify domains for any non-data-URI images
    // or ensure your Next.js version handles data URIs as expected.
  },
};

export default nextConfig;
