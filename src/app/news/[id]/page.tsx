"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function NewsDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/ai-news')
      .then(res => res.json())
      .then((data) => {
        const found = (data.articles || []).find((item: any) => encodeURIComponent(item.url) === id);
        setArticle(found || null);
      });
  }, [id]);

  if (!article) {
    return <div className="container px-4 py-8 mx-auto"><p className="text-muted-foreground">Article not found.</p></div>;
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-3xl">
      <img src={article.image} alt={article.title} className="w-full h-64 object-cover rounded-lg mb-6" />
      <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
      <div className="text-sm text-muted-foreground mb-4">
        {article.source.name} &middot; {article.publishedAt}
      </div>
      <div className="prose prose-invert max-w-none">
        <p>{article.content || article.description}</p>
      </div>
    </div>
  );
} 