import { NewsCardWithBookmark } from '@/components/NewsCardWithBookmark';
import AIStocksSidebar from '@/components/AIStocksSidebar';
import LatestArxivPapers from '@/components/LatestArxivPapers';
import HeroSection from '@/components/HeroSection';
import AIToolsSection from '@/components/AIToolsSection';
import Pagination from '../components/Pagination';
import { getApiUrl } from '@/lib/url';

// Force dynamic rendering to avoid prerender errors with API calls
export const dynamic = 'force-dynamic';

const DEFAULT_NEWS_IMAGE = "/placeholder.svg";

async function getNews(): Promise<any[]> {
  const res = await fetch(getApiUrl('/api/ai-news'), { cache: 'no-store' });
  const data = await res.json();
  // Deduplicate by normalized title
  const uniqueArticles: any[] = [];
  const seen = new Set<string>();
  for (const article of (data.articles || []) as any[]) {
    const normTitle = (article.title || '').toLowerCase().replace(/[^a-z0-9 ]/gi, '').trim();
    if (!seen.has(normTitle)) {
      uniqueArticles.push(article);
      seen.add(normTitle);
    }
  }
  return uniqueArticles;
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
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const news = await getNews();
  const { trendingTopics, recentUpdates } = await getTrendingAndUpdates(news);
  // Pagination logic
  const currentPage = parseInt(searchParams.page || '1');
  const itemsPerPage = 20;
  const totalPages = Math.ceil(news.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNews = news.slice(startIndex, endIndex);

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      <HeroSection />
      <AIToolsSection />
      <div id="news-section" className="flex flex-col md:flex-row gap-12 mt-16 scroll-mt-24">
        <div className="w-full md:w-2/3">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Latest AI News</h2>
            <p className="text-lg text-muted-foreground">
              Stay updated with the most recent developments in artificial intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 auto-rows-fr">
            {paginatedNews.map((article) => {
              // Use imageUrl if available, otherwise image, otherwise empty string (let NewsCard handle fallback)
              const imageUrl = article.imageUrl || article.image || '';
              return (
                <NewsCardWithBookmark
                  key={article.url}
                  id={article.url}
                  title={article.title}
                  summary={article.description}
                  imageUrl={imageUrl}
                  source={article.source?.name || article.source}
                  date={article.publishedAt}
                  url={article.url}
                  readTime={4}
                />
              );
            })}
          </div>

          {/* Pagination */}
          <div className="mt-8">
            {totalPages > 1 ? (
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                totalItems={news.length}
                itemsPerPage={itemsPerPage}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                No pagination needed - all {news.length} articles fit on one page
              </div>
            )}
          </div>

          {/* Newsletter signup removed */}
        </div>

        <div className="w-full md:w-1/3 md:sticky md:top-24 h-fit space-y-6">
          <AIStocksSidebar />
          <LatestArxivPapers />
        </div>
      </div>
    </div>
  );
}
