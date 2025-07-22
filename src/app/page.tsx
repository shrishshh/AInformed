import { NewsCard } from '@/components/news-card';
import AIStocksSidebar from '@/components/AIStocksSidebar';
import TrendingAIJobs from '@/components/TrendingAIJobs';
import LatestArxivPapers from '@/components/LatestArxivPapers';
import { NewsletterSignup } from '@/components/newsletter-signup';
import HeroSection from '@/components/HeroSection';

const DEFAULT_NEWS_IMAGE = "/placeholder.svg";

async function getNews(): Promise<any[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-news`, { cache: 'no-store' });
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

export default async function Home() {
  const news = await getNews();
  const { trendingTopics, recentUpdates } = await getTrendingAndUpdates(news);

  return (
    <div className="container px-4 py-8 mx-auto">
      <HeroSection />
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Latest AI News</h1>
            <p className="text-muted-foreground">
              Stay updated with the most recent developments in artificial intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {news.map((article) => (
              <NewsCard
                key={article.url}
                id={article.url}
                title={article.title}
                summary={article.description}
                imageUrl={article.image || DEFAULT_NEWS_IMAGE}
                source={article.source?.name || article.source}
                date={article.publishedAt}
                url={article.url}
                readTime={4}
              />
            ))}
          </div>

          <div className="mt-8">
            <NewsletterSignup />
          </div>
        </div>

        <div className="w-full md:w-1/3">
          <AIStocksSidebar />
          <TrendingAIJobs />
          <LatestArxivPapers />
        </div>
      </div>
    </div>
  );
}
