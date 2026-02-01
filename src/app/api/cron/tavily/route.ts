import { NextResponse } from 'next/server';
import { updateTavilyCache } from '@/lib/rssCron';
import { getGroupForHour } from '@/lib/tavilyFetcher';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Secret key for cron authentication (use Railway env var)
// In development/localhost, allow without secret for easier testing
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key-change-in-production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.VERCEL;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const group = searchParams.get('group'); // Optional: override group selection

  // Authenticate cron request (skip auth in development/localhost)
  if (!isDevelopment) {
    // Production: require secret
    if (!secret || secret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized - CRON_SECRET required in production' },
        { status: 401 }
      );
    }
  } else {
    // Development: log if secret is provided but don't require it
    if (secret && secret !== CRON_SECRET) {
      console.warn('⚠️ Invalid CRON_SECRET provided, but allowing in development mode');
    }
  }

  try {
    // Determine which group to fetch based on hour (or override)
    const targetGroup = group || getGroupForHour();
    
    console.log(`⏰ Cron triggered: Fetching Tavily articles for group "${targetGroup}"`);
    
    // Update Tavily cache
    await updateTavilyCache(targetGroup);

    return NextResponse.json({
      success: true,
      group: targetGroup,
      timestamp: new Date().toISOString(),
      message: `Tavily cache updated for group: ${targetGroup}`
    });
  } catch (error: any) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update Tavily cache',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also support POST for Railway cron jobs
export async function POST(request: Request) {
  return GET(request);
}

