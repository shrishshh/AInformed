/**
 * URL helper utilities for server-side and client-side URL construction
 * Handles Vercel deployment URLs correctly
 */

/**
 * Get the base URL for the application
 * - Uses VERCEL_URL in production (automatically provided by Vercel)
 * - Falls back to NEXT_PUBLIC_APP_URL if set
 * - Returns empty string for relative URLs (recommended for server-side internal calls)
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
  
  // For server-side internal API calls, return empty string to use relative URLs
  // This works correctly in both development and production
  return '';
}

/**
 * Get the full API URL for a given path
 * @param path - API path (e.g., '/api/ai-news')
 * @returns Full URL or relative path depending on environment
 */
export function getApiUrl(path: string): string {
  const baseUrl = getBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
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

