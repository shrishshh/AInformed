import AIStocksSidebar from '@/components/AIStocksSidebar';
import LatestArxivPapers from '@/components/LatestArxivPapers';
import HeroSection from '@/components/HeroSection';
import AIToolsSection from '@/components/AIToolsSection';
import { getApiUrl } from '@/lib/url';
import { ClientFilteredNews } from '@/components/news/ClientFilteredNews';

// Force dynamic rendering to avoid prerender errors with API calls
export const dynamic = 'force-dynamic';

async function getNews(apiPath: string): Promise<any> {
  try {
    const apiUrl = getApiUrl(apiPath);
    const res = await fetch(apiUrl, { cache: 'no-store' });
    
    if (!res.ok) {
      console.error(`API error: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error('Response text:', text.substring(0, 500));
      return [];
    }
    
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('API returned non-JSON response:', contentType);
      const text = await res.text();
      console.error('Response text:', text.substring(0, 500));
      return [];
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching news:', error);
    return { articles: [], items: [], sections: null, pagination: { page: 1, pageSize: 20, totalInView: 0, totalPages: 1 }, filters: { availableSources: [], availableProducts: [] } };
  }
}

interface TrendingTopic {
  id: string;
  name: string;
  posts: number;
}

interface RecentUpdate {
  id: string;
  title: string;
  date: string;
  url: string;
}

async function getTrendingAndUpdates(articles: any[]): Promise<{ trendingTopics: TrendingTopic[]; recentUpdates: RecentUpdate[] }> {
  // Trending topics by source frequency
  const sourceCounts: Record<string, number> = {};
  articles.forEach((article: any) => {
    const sourceName = article.source?.name || article.source;
    sourceCounts[sourceName] = (sourceCounts[sourceName] || 0) + 1;
  });
  const sortedSources: TrendingTopic[] = Object.entries(sourceCounts)
    .map(([name, posts]) => ({ id: name, name, posts: posts as number }))
    .sort((a, b) => b.posts - a.posts)
    .slice(0, 5);
  const recentUpdates: RecentUpdate[] = articles.slice(0, 4).map((item: any) => ({
    id: item.url,
    title: item.title,
    date: item.publishedAt,
    url: item.url,
  }));
  return { trendingTopics: sortedSources, recentUpdates };
}

export default async function Home({
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // Fetch ONCE; all filtering is client-side (no refetch on filter changes)
  // NOTE: we include refresh=true to ensure caches are populated before first render
  // (prevents an empty DB-cached response on cold start).
  const data = await getNews(`/api/ai-news?refresh=true&limit=500`);
  const articles = data.articles || [];

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      <HeroSection />
      <AIToolsSection />
      <div id="news-section" className="flex flex-col md:flex-row gap-12 mt-16 scroll-mt-24">
        <div className="w-full md:w-2/3">
          <ClientFilteredNews articles={articles} />
        </div>

        <div className="w-full md:w-1/3 md:sticky md:top-24 h-fit space-y-6">
          <AIStocksSidebar />
          <LatestArxivPapers />
        </div>
      </div>
    </div>
  );
}
