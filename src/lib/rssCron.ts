// RSS & GDELT & HN Cron Job Setup
// This module handles scheduled RSS, GDELT, and HN fetching for better performance

import { fetchAllRSSFeeds, convertRSSToNewsFormat } from './rssFetcher';
import { fetchGDELTArticles, fetchGDELTArticlesAlternative, convertGDELTToNewsFormat } from './gdeltFetcher';
import { fetchHNStories, fetchHNStoriesAlternative, convertHNToNewsFormat } from './hnFetcher';

// In-memory cache for RSS, GDELT, and HN articles (in production, use Redis or database)
let rssCache: any[] = [];
let gdeltCache: any[] = [];
let hnCache: any[] = []; // Added HN cache
let lastFetchTime: Date | null = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
let isUpdating = false; // Lock to prevent concurrent updates

// Fetch RSS articles and cache them
export async function updateRSSCache(): Promise<void> {
  try {
    console.log('Updating RSS cache...');
    const rssArticles = await fetchAllRSSFeeds();
    const formattedArticles = convertRSSToNewsFormat(rssArticles);
    rssCache = formattedArticles;
    console.log(`RSS cache updated: ${formattedArticles.length} articles`);
  } catch (error) {
    console.error('Failed to update RSS cache:', error);
  }
}

// Fetch GDELT articles and cache them
export async function updateGDELTCache(): Promise<void> {
  try {
    console.log('Updating GDELT cache...');

    // Try main GDELT method first
    let gdeltArticles = await fetchGDELTArticles();

    // If main method fails, try alternative
    if (gdeltArticles.length === 0) {
      console.log('Main GDELT method failed, trying alternative...');
      gdeltArticles = await fetchGDELTArticlesAlternative();
    }

    const formattedArticles = convertGDELTToNewsFormat(gdeltArticles);
    gdeltCache = formattedArticles;
    console.log(`GDELT cache updated: ${formattedArticles.length} articles`);
  } catch (error) {
    console.error('Failed to update GDELT cache:', error);
  }
}

// Fetch HN articles and cache them
export async function updateHNCache(): Promise<void> {
  try {
    console.log('Updating HN cache...');

    // Try main HN method first
    let hnStories = await fetchHNStories();

    // If main method fails, try alternative
    if (hnStories.length === 0) {
      console.log('Main HN method failed, trying alternative...');
      hnStories = await fetchHNStoriesAlternative();
    }

    const formattedStories = convertHNToNewsFormat(hnStories);
    hnCache = formattedStories;
    console.log(`HN cache updated: ${formattedStories.length} stories`);
  } catch (error) {
    console.error('Failed to update HN cache:', error);
  }
}

// Combined fetch for RSS, GDELT, and HN
export async function updateAllCaches(): Promise<void> {
  // Prevent concurrent updates
  if (isUpdating) {
    console.log('Cache update already in progress, skipping...');
    return;
  }
  
  isUpdating = true;
  try {
    console.log('Updating all caches (RSS + GDELT + HN)...');

    // Fetch all three sources in parallel
    const [rssArticles, gdeltArticles, hnStories] = await Promise.allSettled([
      fetchAllRSSFeeds(),
      fetchGDELTArticles(), // Initial GDELT fetch
      fetchHNStories() // Initial HN fetch
    ]);

    // Process RSS results
    if (rssArticles.status === 'fulfilled') {
      const formattedRSS = convertRSSToNewsFormat(rssArticles.value);
      rssCache = formattedRSS;
      console.log(`RSS cache updated: ${formattedRSS.length} articles`);
    } else {
      console.error('RSS fetch failed:', rssArticles.reason);
    }

    // Process GDELT results
    if (gdeltArticles.status === 'fulfilled') {
      const formattedGDELT = convertGDELTToNewsFormat(gdeltArticles.value);
      gdeltCache = formattedGDELT;
      console.log(`GDELT cache updated: ${formattedGDELT.length} articles`);
    } else {
      console.error('GDELT fetch failed, trying alternative method...');
      // Try alternative GDELT method
      try {
        const alternativeGDELT = await fetchGDELTArticlesAlternative();
        const formattedAlternative = convertGDELTToNewsFormat(alternativeGDELT);
        gdeltCache = formattedAlternative;
        console.log(`GDELT alternative cache updated: ${formattedAlternative.length} articles`);
      } catch (altError) {
        console.error('GDELT alternative also failed:', altError);
        gdeltCache = [];
      }
    }

    // Process HN results
    if (hnStories.status === 'fulfilled') {
      const formattedHN = convertHNToNewsFormat(hnStories.value);
      hnCache = formattedHN;
      console.log(`HN cache updated: ${formattedHN.length} stories`);
    } else {
      console.error('HN fetch failed, trying alternative method...');
      // Try alternative HN method
      try {
        const alternativeHN = await fetchHNStoriesAlternative();
        const formattedAlternative = convertHNToNewsFormat(alternativeHN);
        hnCache = formattedAlternative;
        console.log(`HN alternative cache updated: ${formattedAlternative.length} stories`);
      } catch (altError) {
        console.error('HN alternative also failed:', altError);
        hnCache = [];
      }
    }

    lastFetchTime = new Date();
  } catch (error) {
    console.error('Failed to update all caches:', error);
  } finally {
    isUpdating = false; // Always reset the flag
  }
}

// Get cached RSS articles
export function getCachedRSSArticles(): any[] {
  if (!lastFetchTime || Date.now() - lastFetchTime.getTime() > CACHE_DURATION) {
    updateAllCaches().catch(console.error);
  }
  return rssCache;
}

// Get cached GDELT articles
export function getCachedGDELTArticles(): any[] {
  if (!lastFetchTime || Date.now() - lastFetchTime.getTime() > CACHE_DURATION) {
    updateAllCaches().catch(console.error);
  }
  return gdeltCache;
}

// Get cached HN articles
export function getCachedHNArticles(): any[] {
  if (!lastFetchTime || Date.now() - lastFetchTime.getTime() > CACHE_DURATION) {
    updateAllCaches().catch(console.error);
  }
  return hnCache;
}

// Get all cached articles (RSS + GDELT + HN)
export function getAllCachedArticles(): any[] {
  if (!lastFetchTime || Date.now() - lastFetchTime.getTime() > CACHE_DURATION) {
    updateAllCaches().catch(console.error);
  }
  return [...rssCache, ...gdeltCache, ...hnCache];
}

// Force refresh all caches
export async function refreshAllCaches(): Promise<{ rss: any[], gdelt: any[], hn: any[] }> {
  await updateAllCaches();
  return { rss: rssCache, gdelt: gdeltCache, hn: hnCache };
}

// Initialize cache on module load
updateAllCaches().catch(console.error); 