"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { NewsCard } from "@/components/news-card";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (query) {
      fetch(`/api/ai-news?q=${encodeURIComponent(query)}`)
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
          setResults(uniqueArticles);
        });
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search news..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="rounded-md bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-white text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-colors"
        >
          Search
        </button>
      </form>
      {results.length === 0 ? (
        <p className="text-muted-foreground">No results found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((article: any) => (
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