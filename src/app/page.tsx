import { NewsCardWithBookmark } from '@/components/NewsCardWithBookmark';
// import AIStocksSidebar from '@/components/AIStocksSidebar';
import LatestArxivPapers from '@/components/LatestArxivPapers';
import HeroSection from '@/components/HeroSection';
import AIToolsSection from '@/components/AIToolsSection';
import Pagination from '../components/Pagination';
import { getApiUrl } from '@/lib/url';
import ExpandingFilterPanel from "../components/filters/ExpandingFilterPanel";


// Force dynamic rendering to avoid prerender errors with API calls
export const dynamic = 'force-dynamic';

const DEFAULT_NEWS_IMAGE = "/placeholder.svg";

type HomeSearchParams = {
  page?: string;
  topics?: string;
  sources?: string;
  time?: string;
  location?: string;
};

type NewsApiResponse = {
  articles?: any[];
  items?: any[];
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

async function getNews(
  searchParams?: HomeSearchParams,
  opts?: { page?: number; limit?: number }
): Promise<{ articles: any[]; pagination: NonNullable<NewsApiResponse['pagination']> }> {
  try {
    const sp = new URLSearchParams();
    const parsedPage = parseInt(searchParams?.page ?? '1', 10);
    const urlPage = Number.isFinite(parsedPage) ? parsedPage : 1;
    const page = Math.max(1, opts?.page ?? urlPage);
    const limit = Math.min(100, Math.max(1, opts?.limit ?? 20));
    sp.set("limit", String(limit));
    sp.set("page", String(page));

    // Only force-refresh on base feed (no filters)
    const hasAnyFilter = !!(searchParams?.topics || searchParams?.sources || searchParams?.time || searchParams?.location);
    // Only refresh page 1 (prevents pagination flicker / reshuffling)
    if (!hasAnyFilter && page === 1) sp.set("refresh", "true");

    if (searchParams?.topics) sp.set("topics", searchParams.topics);
    if (searchParams?.sources) sp.set("sources", searchParams.sources);
    if (searchParams?.time) sp.set("time", searchParams.time);
    if (searchParams?.location) sp.set("location", searchParams.location);

    const apiUrl = getApiUrl(`/api/ai-news?${sp.toString()}`);
    const res = await fetch(apiUrl, { cache: 'no-store' });
    
    if (!res.ok) {
      console.error(`API error: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error('Response text:', text.substring(0, 500));
      return {
        articles: [],
        pagination: {
          page,
          limit,
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: page > 1,
        },
      };
    }
    
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('API returned non-JSON response:', contentType);
      const text = await res.text();
      console.error('Response text:', text.substring(0, 500));
      return {
        articles: [],
        pagination: {
          page,
          limit,
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: page > 1,
        },
      };
    }
    
    const data = (await res.json()) as NewsApiResponse;
    const articles = (data.articles || data.items || []) as any[];
    const pagination = data.pagination || {
      page,
      limit,
      totalItems: articles.length,
      totalPages: Math.max(1, Math.ceil(articles.length / limit)),
      hasNextPage: false,
      hasPrevPage: page > 1,
    };

    return { articles, pagination };
  } catch (error) {
    console.error('Error fetching news:', error);
    return {
      articles: [],
      pagination: {
        page: 1,
        limit: 20,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
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
  searchParams,
}: {
  searchParams: HomeSearchParams;
}) {
  const currentPage = parseInt(searchParams.page || '1');
  const itemsPerPage = 20;
  const { articles: paginatedNews, pagination } = await getNews(searchParams, {
    page: currentPage,
    limit: itemsPerPage,
  });
  const { trendingTopics, recentUpdates } = await getTrendingAndUpdates(paginatedNews);

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      <HeroSection />
      <AIToolsSection />
      <div id="news-section" className="flex flex-col md:flex-row gap-12 mt-16 scroll-mt-24">
        <div className="w-full md:w-3/4">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Latest AI News</h2>
            <p className="text-lg text-muted-foreground">
              Stay updated with the most recent developments in artificial intelligence
            </p>
          </div>
          <ExpandingFilterPanel />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 auto-rows-fr mt-8">
            {paginatedNews.map((article) => {
              // Use imageUrl if available, otherwise image, otherwise empty string (let NewsCard handle fallback)
              const imageUrl = article.imageUrl || article.image || '';
              return (
                <NewsCardWithBookmark
                  key={article.url}
                  id={article.url}
                  title={article.title}
                  summary={article.description || ""}
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
            {pagination.totalPages > 1 ? (
              <Pagination 
                currentPage={currentPage} 
                totalPages={pagination.totalPages} 
                totalItems={pagination.totalItems}
                itemsPerPage={itemsPerPage}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                No pagination needed - all {pagination.totalItems} articles fit on one page
              </div>
            )}
          </div>

          {/* Newsletter signup removed */}
        </div>

        <div className="w-full md:w-1/3 md:sticky md:top-24 h-fit space-y-6">
          {/* <AIStocksSidebar /> */}
          <LatestArxivPapers />
        </div>
      </div>
    </div>
  );
}
