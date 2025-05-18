
"use client";

import { useState, useEffect } from "react";
import type { NewsArticle } from "@/lib/types";
import { ArticleCard } from "@/components/news/ArticleCard";
import { FeedCustomizationForm } from "@/components/news/FeedCustomizationForm";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { generateNewsFeed, GenerateNewsFeedInput, GenerateNewsFeedOutput } from "@/ai/flows/generate-news-feed";
import { useToast } from "@/hooks/use-toast";
import { useSavedArticles } from "@/hooks/useSavedArticles";
import { AlertCircle, ListX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Store form state in localStorage to persist user preferences
const FEED_PREFERENCES_KEY = "newsWiseFeedPreferences";

export default function HomePage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { savedArticles, saveArticle, unsaveArticle, isArticleSaved, isLoaded: savedArticlesLoaded } = useSavedArticles();
  const [initialFormValues, setInitialFormValues] = useState<Partial<GenerateNewsFeedInput> | undefined>(undefined);


  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPreferences = localStorage.getItem(FEED_PREFERENCES_KEY);
      if (storedPreferences) {
        try {
          const parsedPrefs = JSON.parse(storedPreferences);
          setInitialFormValues(parsedPrefs);
          // Automatically fetch news on load if preferences exist
          fetchNews(parsedPrefs);
        } catch (e) {
          console.error("Failed to parse stored preferences", e);
          localStorage.removeItem(FEED_PREFERENCES_KEY); // Clear corrupted data
        }
      } else {
        // Set initial state for form if no preferences stored
        setInitialFormValues({ 
          keywords: ["technology", "AI"], 
          topics: ["latest advancements", "ethical AI"], 
          reliabilityScore: 0.7,
          numberOfArticles: 5 
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount


  const fetchNews = async (input: GenerateNewsFeedInput) => {
    setIsLoading(true);
    setError(null);
    setArticles([]); // Clear previous articles

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(FEED_PREFERENCES_KEY, JSON.stringify(input));
      }
      const result: GenerateNewsFeedOutput = await generateNewsFeed(input);
      if (result.articles && result.articles.length > 0) {
        // Add a placeholder image and a unique ID to each article
        const articlesWithPlaceholders: NewsArticle[] = result.articles.map((article, index) => ({
          ...article,
          id: article.url || `article-${Date.now()}-${index}`, // Use URL as ID or generate one
          imageUrl: `https://placehold.co/600x400.png?t=${Date.now()}-${index}`, // Unique placeholder
          publishedDate: new Date().toISOString(), // Placeholder date if not provided by AI
        }));
        setArticles(articlesWithPlaceholders);
      } else {
        setArticles([]);
        toast({
          title: "No Articles Found",
          description: "Try adjusting your preferences for different results.",
        });
      }
    } catch (e) {
      console.error("Failed to fetch news feed:", e);
      setError("Failed to generate news feed. Please try again later.");
      toast({
        title: "Error Fetching News",
        description: "There was a problem connecting to the news service.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSave = (article: NewsArticle) => {
    if (isArticleSaved(article.url)) {
      unsaveArticle(article.url);
      toast({ title: "Article Unsaved", description: `"${article.title}" removed from your saved list.` });
    } else {
      saveArticle(article);
      toast({ title: "Article Saved", description: `"${article.title}" added to your saved list.` });
    }
  };

  return (
    <PageWrapper>
      {initialFormValues && <FeedCustomizationForm onSubmit={fetchNews} isLoading={isLoading} initialValues={initialFormValues} />}

      {isLoading && (
        <div className="flex flex-col items-center justify-center my-12">
          <LoadingSpinner size={48} />
          <p className="mt-4 text-lg text-muted-foreground">Generating your personalized feed...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="my-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && articles.length === 0 && (
        <div className="flex flex-col items-center justify-center my-12 text-center">
          <ListX className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Articles Yet</h2>
          <p className="text-muted-foreground">
            Adjust your preferences above and click "Generate Feed" to see articles.
          </p>
        </div>
      )}

      {!isLoading && !error && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              isSaved={isArticleSaved(article.url)}
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
