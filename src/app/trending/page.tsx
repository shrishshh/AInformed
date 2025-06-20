"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TrendingPage() {
  const [topics, setTopics] = useState<any[]>([]);

  /**
   * Same feedback as what I mentioned on /src/app/page.tsx
   * Ideally, use an async server component with caching here
   */
  useEffect(() => {
    fetch('/api/ai-news')
      .then(res => res.json())
      .then(data => {
        const articles = data.articles || [];
        const topicMap: Record<string, number> = {};
        articles.forEach((item: any) => {
          const cat = item.source.name;
          topicMap[cat] = (topicMap[cat] || 0) + 1;
        });
        const topicsArr = Object.entries(topicMap)
          .map(([name, posts]) => ({ name, posts }))
          .sort((a, b) => b.posts - a.posts)
          .slice(0, 5);
        setTopics(topicsArr);
      });
  }, []);

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Trending Topics</h1>
      <ul className="space-y-4">
        {topics.map((topic, idx) => (
          <li key={topic.name} className="flex items-center gap-4">
            <span className ="text-lg font-semibold">#{idx + 1}</span>
            <Link href={`/categories/${encodeURIComponent(topic.name)}`} className="text-primary hover:underline text-lg">
              {topic.name}
            </Link>
            <span className="ml-auto text-muted-foreground">{topic.posts} posts</span>
          </li>
        ))}
      </ul>
    </div>
  );
} 