'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryTabs } from '@/components/category-tabs';
import { NewsCard } from '@/components/news-card';
import { TrendingSidebar } from '@/components/trending-sidebar';
import { NewsletterSignup } from '@/components/newsletter-signup';

const DEFAULT_NEWS_IMAGE = "/placeholder.svg";

export default function Home() {
  const [news, setNews] = useState<any[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const router = useRouter();

  // Load bookmarks from localStorage
  useEffect(() => {
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
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Deduplicate by title+source
  useEffect(() => {
    fetch('/api/ai-news')
      .then(res => res.json())
      .then(data => {
        const articles = data.articles || [];
        const uniqueArticles: any[] = [];
        const seenUrls = new Set();
        for (const article of articles) {
          if (article.url && !seenUrls.has(article.url)) {
            uniqueArticles.push(article);
            seenUrls.add(article.url);
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
