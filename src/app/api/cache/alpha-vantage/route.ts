import { NextResponse } from 'next/server';
import { alphaVantageCache } from '../../../../lib/alphaVantageCache';

export async function GET() {
  try {
    const stats = await alphaVantageCache.getCacheStats();
    return NextResponse.json({
      source: 'Alpha Vantage',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Alpha Vantage cache stats error:', error);
    return NextResponse.json({ error: 'Failed to get Alpha Vantage cache stats' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await alphaVantageCache.clearCache();
    return NextResponse.json({ 
      message: 'Alpha Vantage cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Alpha Vantage cache clear error:', error);
    return NextResponse.json({ error: 'Failed to clear Alpha Vantage cache' }, { status: 500 });
  }
}
