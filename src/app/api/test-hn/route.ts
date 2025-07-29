import { NextResponse } from 'next/server';
import { fetchHNStories, convertHNToNewsFormat } from '@/lib/hnFetcher';

export async function GET() {
  try {
    console.log('Testing HN API...');
    const hnStories = await fetchHNStories();
    const formattedStories = convertHNToNewsFormat(hnStories);

    return NextResponse.json({
      success: true,
      totalStories: hnStories.length,
      stories: formattedStories.slice(0, 10), // Return first 10 for testing
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('HN test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 