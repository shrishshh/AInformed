/**
 * URL helper utilities for server-side and client-side URL construction
 * Handles Vercel deployment URLs correctly
 */

/**
 * Get the base URL for the application
 * - Uses VERCEL_URL in production (automatically provided by Vercel)
 * - Falls back to NEXT_PUBLIC_APP_URL if set
 * - For server-side: MUST return absolute URL (Next.js server fetch requires this)
 */
export function getBaseUrl(): string {
  // In production on Vercel, use VERCEL_URL (automatically provided)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Use NEXT_PUBLIC_APP_URL if explicitly set
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // For server-side fetch, we MUST use an absolute URL
  // Default to production URL if nothing is set
  // In development, this will use localhost if NEXT_PUBLIC_APP_URL is set to http://localhost:3000
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : 'https://www.ainformed.in';
}

/**
 * Get the full API URL for a given path
 * @param path - API path (e.g., '/api/ai-news')
 * @returns Full URL (always absolute for server-side fetch)
 */
export function getApiUrl(path: string): string {
  const baseUrl = getBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Get the full URL for a given path (for metadata, sitemaps, etc.)
 * @param path - Path (e.g., '/news/article')
 * @returns Full URL
 */
export function getFullUrl(path: string): string {
  const baseUrl = getBaseUrl();
  // If no base URL, use default production URL
  const defaultBase = 'https://www.ainformed.in';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${normalizedPath}` : `${defaultBase}${normalizedPath}`;
}

