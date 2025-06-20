import type {NextConfig} from 'next';

/**
 * Why do you have next.config.mjs AND next.config.ts?
 * 
 * Have one or the other, but note that next.config.ts is not supported until you upgrade to NextJS 15
 * I recommend using next.config.mjs for now, and then upgrading to next.config.ts when you upgrade to NextJS 15
 */
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
      // Allowing all hostnames for development purposes.
      // WARNING: This is not recommended for production due to security risks.
      // In production, you should list only the specific hostnames you trust.
      { hostname: '**' }
      // Commenting out specific hostnames as wildcard is used:
      // { hostname: 'media.cnn.com' },
      // { hostname: 's.abcnews.com' },
      // { hostname: 'image.cnbcfm.com' },
      // { hostname: 'static.foxnews.com' },
      // { hostname: 'storage.googleapis.com' }, // Google News, etc.
      // { hostname: 'dims.apnews.com' }, // Associated Press
      // { hostname: 'i.kinja-img.com' }, // Gizmodo, Kotaku, etc. (G/O Media)
      // { hostname: '*.reutersmedia.net' }, // Reuters
      // { hostname: 'images.wsj.net' }, // Wall Street Journal
      // { hostname: 'static01.nyt.com' }, // New York Times
      // { hostname: 'img.etimg.com' }, // Economic Times (India)
      // { hostname: 'www.theblock.co' },
      // { hostname: 'techcrunch.com' },
      // { hostname: '*.google.com' }, // General Google images (news, etc.)
      // { hostname: 's.yimg.com' }, // Yahoo News / Verizon Media
      // { hostname: 'c.biztoc.com' }, // BizToc
      // { hostname: 'images.axios.com' }, // Axios
      // { hostname: 'media.wired.com' }, // Wired
      // { hostname: 'assets.bwbx.io' }, // Bloomberg
      // { hostname: 'images.unsplash.com' }, // If you use Unsplash for fallbacks
      // { hostname: 'cdn.vox-cdn.com'}, // Vox Media (The Verge, etc.)
      // { hostname: 'www.theverge.com'},
      // { hostname: 'www.engadget.com'},
      // { hostname: 's.aolcdn.com'}, // Engadget, TechCrunch (some assets)
      // { hostname: 'www.aljazeera.com'},
      // { hostname: 'www.reuters.com'},
      // { hostname: 'www.euronews.com'},
      // { hostname: 'ichef.bbci.co.uk'}, // BBC Images
      // { hostname: 'news.google.com'},
      // { hostname: 'www.indiewire.com' },
      // { hostname: 'imageio.forbes.com' }, // Added to fix the error
      // { hostname: 'www.androidauthority.com' }, // Added to fix the error
      // { hostname: 'smartcdn.gprod.postmedia.digital' }, // Added to fix the error
      // { hostname: 'd.ibtimes.com.au' }, // Added to fix the error
      // { hostname: 'img.helpnetsecurity.com' }, // Added to fix the error
      // { hostname: 'cdn.antaranews.com' }, // Added to fix the error
      // Add more specific hostnames as you encounter them from NewsAPI
      // Or, for wider but less secure coverage during development:
      // { protocol: 'https', hostname: '**' } // Allows all HTTPS images
    ],
    // Data URIs are still supported for fallbacks or other uses.
    dangerouslyAllowSVG: true, // If you use SVG data URIs as fallbacks
    // Temporarily relax Content Security Policy for image loading from external sources.
    // For production, consider a more strict policy with explicit image domains.
    contentSecurityPolicy: "default-src 'self'; img-src *; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
