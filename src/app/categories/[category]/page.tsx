"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NewsCardWithBookmark } from "@/components/NewsCardWithBookmark";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Category keyword mapping for client-side filtering
const categoryKeywords: Record<string, string[]> = {
  'Artificial Intelligence': ['artificial intelligence', 'ai', 'generative ai', 'ai model', 'ai system', 'ai technology', 'ai development', 'ai research', 'ai breakthrough', 'ai innovation'],
  'Machine Learning': ['machine learning', 'ml', 'supervised learning', 'unsupervised learning', 'reinforcement learning', 'ml model', 'ml algorithm', 'machine learning model', 'ml system'],
  'Deep Learning': ['deep learning', 'neural network', 'neural networks', 'deep neural', 'cnn', 'rnn', 'transformer', 'deep learning model', 'neural architecture', 'deep neural network'],
  'Natural Language Processing': ['natural language processing', 'nlp', 'language model', 'llm', 'gpt', 'bert', 'transformer', 'text processing', 'nlp model', 'large language model', 'language ai'],
  'Computer Vision': ['computer vision', 'image recognition', 'object detection', 'cv', 'image processing', 'visual ai', 'computer vision model', 'image ai', 'visual recognition'],
  'Robotics': ['robotics', 'robot', 'autonomous robot', 'robotic automation', 'robotic system', 'robotic technology', 'autonomous system', 'robotic ai'],
  'Data Science': ['data science', 'big data', 'data analytics', 'predictive analytics', 'data analysis', 'data scientist', 'data mining', 'data processing'],
  'Cybersecurity': ['cybersecurity', 'ai security', 'cyber security', 'threat detection', 'security ai', 'cyber threat', 'security system', 'ai security', 'cyber defense'],
  'Quantum Computing': ['quantum computing', 'quantum ai', 'quantum machine learning', 'qubit', 'quantum computer', 'quantum algorithm', 'quantum technology'],
  'AI Ethics': ['ai ethics', 'ethical ai', 'ai bias', 'responsible ai', 'ai governance', 'ai fairness', 'ethical artificial intelligence', 'ai regulation'],
  'Neural Networks': ['neural network', 'neural networks', 'artificial neural network', 'ann', 'neural architecture', 'neural model', 'neural ai'],
  'Automation': ['automation', 'intelligent automation', 'ai automation', 'process automation', 'automated system', 'ai-powered automation', 'intelligent system'],
  'Big Data': ['big data', 'large-scale data', 'data infrastructure', 'data warehousing', 'data lake', 'data pipeline', 'data architecture', 'data processing at scale'],
};

// Function to check if article matches category
function articleMatchesCategory(article: any, category: string): boolean {
  const keywords = categoryKeywords[category] || [];
  if (keywords.length === 0) return false;

  const title = (article.title || '').toLowerCase();
  const description = (article.description || article.summary || '').toLowerCase();
  const fullText = `${title} ${description}`;

  // Check if any keyword appears in the article
  return keywords.some(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    // For multi-word keywords, check if all words appear
    const words = lowerKeyword.split(/\s+/);
    if (words.length > 1) {
      // All words must appear (in any order)
      return words.every(word => fullText.includes(word));
    } else {
      // Single word: check for word boundary or partial match
      const regex = new RegExp(`\\b${lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(fullText) || fullText.includes(lowerKeyword);
    }
  });
}

export default function CategoryPage() {
  const { category } = useParams();
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setIsLoading(true);
      setError(null);
      const decodedCategory = decodeURIComponent(category as string);
      
      // Fetch ALL articles (same as home page - no category parameter)
      // This includes all RSS feeds, GDELT, HN, and GNews articles
      fetch(`/api/ai-news`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch articles: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          const allArticles = data.articles || [];
          
          // Client-side filter: Only keep articles that match this category
          const filteredArticles = allArticles.filter((article: any) => 
            articleMatchesCategory(article, decodedCategory)
          );
          
          // Deduplicate by URL
          const uniqueArticles: any[] = [];
          const seen = new Set();
          for (const article of filteredArticles) {
            if (!seen.has(article.url)) {
              uniqueArticles.push(article);
              seen.add(article.url);
            }
          }
          
          setNews(uniqueArticles);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching category news:', err);
          setError('Failed to load articles. Please try again.');
          setIsLoading(false);
        });
    }
  }, [category]);

  const decodedCategory = category ? decodeURIComponent(category as string) : '';

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="text-3xl font-bold mb-2">{decodedCategory} News</h1>
      <p className="text-muted-foreground mb-6">
        Latest articles and updates about {decodedCategory.toLowerCase()}
      </p>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading articles...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : news.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No articles found for this category. Check back later for updates!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {news.map((article: any) => (
            <NewsCardWithBookmark
              key={article.url}
              id={article.url}
              title={article.title}
              summary={article.description}
              imageUrl={article.image || article.imageUrl}
              source={article.source?.name || article.source}
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