
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
      // Common News API sources - this list can be expanded.
      // Generic patterns for major CDNs or news outlets:
      { hostname: 'media.cnn.com' },
      { hostname: 's.abcnews.com' },
      { hostname: 'image.cnbcfm.com' },
      { hostname: 'static.foxnews.com' },
      { hostname: 'storage.googleapis.com' }, // Google News, etc.
      { hostname: 'dims.apnews.com' }, // Associated Press
      { hostname: 'i.kinja-img.com' }, // Gizmodo, Kotaku, etc. (G/O Media)
      { hostname: '*.reutersmedia.net' }, // Reuters
      { hostname: 'images.wsj.net' }, // Wall Street Journal
      { hostname: 'static01.nyt.com' }, // New York Times
      { hostname: 'img.etimg.com' }, // Economic Times (India)
      { hostname: 'www.theblock.co' },
      { hostname: 'techcrunch.com' },
      { hostname: '*.google.com' }, // General Google images (news, etc.)
      { hostname: 's.yimg.com' }, // Yahoo News / Verizon Media
      { hostname: 'c.biztoc.com' }, // BizToc
      { hostname: 'images.axios.com' }, // Axios
      { hostname: 'media.wired.com' }, // Wired
      { hostname: 'assets.bwbx.io' }, // Bloomberg
      { hostname: 'images.unsplash.com' }, // If you use Unsplash for fallbacks
      { hostname: 'cdn.vox-cdn.com'}, // Vox Media (The Verge, etc.)
      { hostname: 'www.theverge.com'},
      { hostname: 'www.engadget.com'},
      { hostname: 's.aolcdn.com'}, // Engadget, TechCrunch (some assets)
      { hostname: 'www.aljazeera.com'},
      { hostname: 'www.reuters.com'},
      { hostname: 'www.euronews.com'},
      { hostname: 'ichef.bbci.co.uk'}, // BBC Images
      { hostname: 'news.google.com'},
      { hostname: 'www.indiewire.com' }, // Added to fix the error
      // Add more specific hostnames as you encounter them from NewsAPI
      // Or, for wider but less secure coverage during development:
      // { protocol: 'https', hostname: '**' } // Allows all HTTPS images
    ],
    // Data URIs are still supported for fallbacks or other uses.
    dangerouslyAllowSVG: true, // If you use SVG data URIs as fallbacks
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Basic CSP for images
  },
};

export default nextConfig;
