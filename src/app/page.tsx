'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryTabs } from '@/components/category-tabs';
import { NewsCard } from '@/components/news-card';
import { TrendingSidebar } from '@/components/trending-sidebar';
import { NewsletterSignup } from '@/components/newsletter-signup';

export default function Home() {
  const [news, setNews] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/ai-news')
      .then(res => res.json())
      .then(data => {
        const articles = data.articles || [];
        // Deduplicate by URL
        const uniqueArticles: any[] = [];
        const seen = new Set();
        for (const article of articles) {
          if (!seen.has(article.url)) {
            uniqueArticles.push(article);
            seen.add(article.url);
          }
        }
        setNews(uniqueArticles);
        setCategories([
          ...new Set(uniqueArticles.map((item: any) => item.source.name))
        ]);
        setTrendingTopics(
          uniqueArticles.slice(0, 5).map((item: any, idx: number) => ({
            id: item.url,
            name: item.source.name,
            posts: Math.floor(Math.random() * 1000) + 100,
            change: `+${Math.floor(Math.random() * 25) + 1}%`,
          }))
        );
        setRecentUpdates(
          uniqueArticles.slice(0, 4).map((item: any) => ({
            id: item.url,
            title: item.title,
            date: item.publishedAt,
          }))
        );
      });
  }, []);

  const handleCategoryChange = (category: string) => {
    router.push(`/categories/${encodeURIComponent(category)}`);
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
            categories={categories}
            onCategoryChange={handleCategoryChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {news.map((article: any) => (
              <NewsCard
                key={article.url}
                id={article.url}
                title={article.title}
                summary={article.description}
                imageUrl={article.image}
                source={article.source.name}
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
          <TrendingSidebar trendingTopics={trendingTopics} recentUpdates={recentUpdates} />
        </div>
      </div>
    </div>
  );
}
