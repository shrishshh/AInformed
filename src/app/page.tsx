'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryTabs } from '@/components/category-tabs';
import { NewsCard } from '@/components/news-card';
import { TrendingSidebar } from '@/components/trending-sidebar';
import { NewsletterSignup } from '@/components/newsletter-signup';

const DEFAULT_NEWS_IMAGE = "/placeholder.svg";

/**
 * If you can eliminate the use of "useState", "useEffect", and "useRouter" from this file,
 * you can remove "use client" from this file and make this an async server component.
 * 
 * Benefit is that you can change your /api/ai-news useEffect to just:
 *   ```tsx
 *   const news = await fetch('/api/ai-news', {
 *     next: {
 *       revalidate: 900, // 15 mins 
 *     },
 *   });
 *   const data = await news.json();
 *   const articles = data.articles || [];
 *   ```
 * 
 * With this, you:
 * 1. Don't have to handle the loading state
 * 2. First user may have a longer load time, but subsequent users will have a faster load time
 * 3. You can limit the number of redundant requests you are making to gnews api (saving your daily limit)
 * 
 */
export default function Home() {
  /**
   * The use of "any" in a TypeScript codebase makes me sad :(
   * 
   * Using "any" disables all typechecking for that variable and attributes derived from it.
   * This means that you might each a scenario in your app where you expected news[0].title to be present,
   * but it's actually undefined and your app crashes.
   * 
   * The solution? Use `zod` to specify a schema you expect the data to be in, and use that to
   * guarantee that your data is always in the shape you expect it to be *after* you fetch & parse it.
   * 
   * e.g.
   *
   * const NewsArticleSchema = z.object({
   *   title: z.string(),
   *   summary: z.string(),
   *   source: z.string(),
   *   url: z.string(),
   *   imageUrl: z.string().url().optional().nullable(),
   *   publishedDate: z.string(),
   * });
   * 
   * const news = await fetch('/api/ai-news')
   *  .then(res => res.json())
   *  .then(data => z.array(NewsArticleSchema).parse(data))
   *  .catch(err => {
   *    // if the data is not in the shape you expect, you can return an empty array, or handle it in a way that makes sense for your app
   *    console.error(err);
   *    return [];
   *  });
   */
  const [news, setNews] = useState<any[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const router = useRouter();

  // Load bookmarks from localStorage
  /**
   * NOTE: If you do turn this into an async server component, you'll need to move this useEffect
   * to a client component. That means that maybe the list of <NewsCard> components will need to be
   * something like `news-card-list.tsx` which can have this hook to load from localStorage.
   * 
   * Using Browser APIs like localStorage necessarily means you need a client component, so that is
   * why this would need to be moved out and cannot be something like `await localStorage.getItem('bookmarks')`
   * like you can do with `fetch`.
   */
  useEffect(() => {
    // Make sure that if we are on the server, we don't try to access localStorage (will error)
    if (typeof window === "undefined") return;
    const loadBookmarks = () => {
      const saved = localStorage.getItem('bookmarks');
      if (saved) setBookmarks(JSON.parse(saved));
    };
    loadBookmarks();
    window.addEventListener('storage', loadBookmarks);
    return () => window.removeEventListener('storage', loadBookmarks);
  }, []);

  // Save bookmarks to localStorage
  useEffect(() => {
    // Make sure that if we are on the server, we don't try to access localStorage (will error)
    if (typeof window === "undefined") return;
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Deduplicate by title
  /**
   * If you are fetching data from the client-side, you should do so using React Query.
   * While it seems simple to just use useEffect, it's not.
   * Read: https://tkdodo.eu/blog/why-you-want-react-query
   */
  useEffect(() => {
    // Make sure that if we are on the server, we don't try to access localStorage (will error)
    if (typeof window === "undefined") return;
    fetch('/api/ai-news')
      .then(res => res.json())
      .then(data => {
        const articles = data.articles || [];
        const uniqueArticles: any[] = [];
        const seen = new Set();
        for (const article of articles) {
          const normTitle = (article.title || '').toLowerCase().replace(/[^a-z0-9 ]/gi, '').trim();
          if (!seen.has(normTitle)) {
            uniqueArticles.push(article);
            seen.add(normTitle);
          }
        }
        setNews(uniqueArticles);

        // Calculate trending topics based on source frequency
        const sourceCounts: { [key: string]: number } = {};
        uniqueArticles.forEach((article: any) => {
          const sourceName = article.source.name;
          sourceCounts[sourceName] = (sourceCounts[sourceName] || 0) + 1;
        });

        const sortedSources = Object.entries(sourceCounts)
          .map(([name, posts]) => ({ id: name, name, posts }))
          .sort((a, b) => b.posts - a.posts)
          .slice(0, 5); // Get top 5 trending sources

        setTrendingTopics(sortedSources);
        
        setRecentUpdates(
          uniqueArticles.slice(0, 4).map((item: any) => ({
            id: item.url,
            title: item.title,
            date: item.publishedAt,
            url: item.url,
          }))
        );
      });
  }, []);

  const handleCategoryChange = (category: string) => {
    router.push(`/categories/${encodeURIComponent(category)}`);
  };

  const handleToggleBookmark = (article: any) => {
    const exists = bookmarks.some((a) => a.url === article.url);
    if (exists) {
      setBookmarks(bookmarks.filter((a) => a.url !== article.url));
    } else {
      // Normalize bookmark object
      setBookmarks([
        ...bookmarks,
        {
          ...article,
          image: article.image || article.imageUrl,
          source: article.source?.name || article.source,
        },
      ]);
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Latest AI News</h1>
            <p className="text-muted-foreground">
              Stay updated with the most recent developments in artificial intelligence
            </p>
          </div>

          <CategoryTabs
            onCategoryChange={handleCategoryChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {news.map((article: any) => (
              <NewsCard
                key={article.url}
                id={article.url}
                title={article.title}
                summary={article.description}
                imageUrl={article.image || DEFAULT_NEWS_IMAGE}
                source={article.source.name}
                date={article.publishedAt}
                url={article.url}
                readTime={4}
                isBookmarked={bookmarks.some((a) => a.url === article.url)}
                onToggleBookmark={handleToggleBookmark}
              />
            ))}
          </div>

          <div className="mt-8">
            <NewsletterSignup />
          </div>
        </div>

        <div className="w-full md:w-1/3">
          <TrendingSidebar trendingTopics={trendingTopics} recentUpdates={recentUpdates} />
        </div>
      </div>
    </div>
  );
}
