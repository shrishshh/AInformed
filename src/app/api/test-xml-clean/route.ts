import { NextResponse } from 'next/server';
import { fetchAllRSSFeeds, convertRSSToNewsFormat } from '@/lib/rssFetcher';

export async function GET() {
  try {
    console.log('Testing RSS feeds with XML cleaning...');
    const rssArticles = await fetchAllRSSFeeds();
    const formattedArticles = convertRSSToNewsFormat(rssArticles);
    
    // Find articles with XML artifacts
    const articlesWithXmlArtifacts = formattedArticles.filter(article => 
      article.title.includes(']]>') || 
      article.title.includes('<![CDATA[') ||
      article.description.includes(']]>') || 
      article.description.includes('<![CDATA[') ||
      article.title.includes('&nbsp;') ||
      article.description.includes('&nbsp;')
    );
    
    const cleanArticles = formattedArticles.filter(article => 
      !article.title.includes(']]>') && 
      !article.title.includes('<![CDATA[') &&
      !article.description.includes(']]>') && 
      !article.description.includes('<![CDATA[') &&
      !article.title.includes('&nbsp;') &&
      !article.description.includes('&nbsp;')
    );
    
    return NextResponse.json({
      success: true,
      totalArticles: rssArticles.length,
      articlesWithXmlArtifacts: articlesWithXmlArtifacts.length,
      cleanArticles: cleanArticles.length,
      sampleArticlesWithArtifacts: articlesWithXmlArtifacts.slice(0, 3),
      sampleCleanArticles: cleanArticles.slice(0, 3),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('XML clean test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 