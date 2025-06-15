"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { NewsCard } from "@/components/news-card";

export default function CategoryPage() {
  const { category } = useParams();
  const [news, setNews] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (category) {
      fetch(`/api/ai-news?category=${category as string}`)
        .then(res => res.json())
        .then(data => {
          const articles = data.articles || [];
          const uniqueArticles: any[] = [];
          const seen = new Set();
          for (const article of articles) {
            if (!seen.has(article.url)) {
              uniqueArticles.push(article);
              seen.add(article.url);
            }
          }
          setNews(uniqueArticles);
        });
    }
  }, [category]);

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="text-3xl font-bold mb-6">{decodeURIComponent(category as string)} News</h1>
      {news.length === 0 ? (
        <p className="text-muted-foreground">No articles found for this category.</p>
      ) : (
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
      )}
    </div>
  );
} 