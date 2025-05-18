
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
      // Add domains for news sources from NewsAPI as you encounter them.
      // This is a starting list, NewsAPI aggregates from many sources.
      // Examples:
      { hostname: 's.abcnews.com' },
      { hostname: 'media.cnn.com' },
      { hostname: 'image.cnbcfm.com' },
      { hostname: 'static.foxnews.com' },
      { hostname: 'storage.googleapis.com' }, // Common for Google News
      { hostname: 'dims.apnews.com' },
      { hostname: 'i.kinja-img.com' }, // Gizmodo, Kotaku, etc.
      { hostname: '*.reutersmedia.net' }, // Reuters (wildcard for subdomains)
      { hostname: 'images.wsj.net' }, // Wall Street Journal
      { hostname: 'static01.nyt.com' }, // New York Times
      { hostname: 'img.etimg.com' }, // Economic Times
      { hostname: 'www.theblock.co' },
      { hostname: 'techcrunch.com' },
      { hostname: '*.google.com' }, // For images from google news etc.
      // Add more hostnames as needed based on NewsAPI sources you use
      // Or, for wider but less secure coverage:
      // { protocol: 'https', hostname: '**' } // Allows all HTTPS images
    ],
    // Data URIs are still supported for fallbacks or other uses.
  },
};

export default nextConfig;
