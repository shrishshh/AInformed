
"use client";

import { useState, useEffect } from "react";
import type { NewsArticle } from "@/lib/types";
import { ArticleCard } from "@/components/news/ArticleCard";
import { FeedCustomizationForm } from "@/components/news/FeedCustomizationForm";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { generateNewsFeed, GenerateNewsFeedInput } from "@/ai/flows/generate-news-feed";
// generateArticleImage is removed as NewsAPI provides image URLs
import { useToast } from "@/hooks/use-toast";
import { useSavedArticles } from "@/hooks/useSavedArticles";
import { AlertTriangle, ListX } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FEED_PREFERENCES_KEY = "AInformedFeedPreferences_v3"; // Incremented version due to schema change

const DEFAULT_NUMBER_OF_ARTICLES = 15;

export default function HomePage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Fetching live news articles..."); // Updated message
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { saveArticle, unsaveArticle, isArticleSaved } = useSavedArticles();
  
  // Simplified initial form values, mainly for search query
  const [initialFormValues, setInitialFormValues] = useState<Partial<GenerateNewsFeedInput>>({
    searchQuery: "latest technology AI", // Default search query
    numberOfArticles: DEFAULT_NUMBER_OF_ARTICLES,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPreferences = localStorage.getItem(FEED_PREFERENCES_KEY);
      if (storedPreferences) {
        try {
          const parsedPrefs = JSON.parse(storedPreferences) as GenerateNewsFeedInput;
          setInitialFormValues({
            searchQuery: parsedPrefs.searchQuery || "latest technology AI",
            numberOfArticles: parsedPrefs.numberOfArticles || DEFAULT_NUMBER_OF_ARTICLES,
          });
        } catch (e) {
          console.error("Failed to parse stored preferences", e);
          localStorage.removeItem(FEED_PREFERENCES_KEY);
           setInitialFormValues({ 
            searchQuery: "latest technology AI",
            numberOfArticles: DEFAULT_NUMBER_OF_ARTICLES 
          });
        }
      } else {
         setInitialFormValues({ 
          searchQuery: "latest technology AI",
          numberOfArticles: DEFAULT_NUMBER_OF_ARTICLES 
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const fetchNews = async (input: GenerateNewsFeedInput) => {
    setIsLoading(true);
    setError(null);
    setArticles([]); 
    setLoadingMessage("Fetching live news articles...");

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(FEED_PREFERENCES_KEY, JSON.stringify(input));
      }
      // The flow now fetches real articles including their image URLs
      const feedResult = await generateNewsFeed(input);
      
      if (feedResult.articles && feedResult.articles.length > 0) {
        // Map articles and ensure they have an ID (using URL)
        const articlesWithIds = feedResult.articles.map((article, index) => ({
          ...article,
          id: article.url || `article-${Date.now()}-${index}`,
          // imageUrl is now directly from NewsAPI
          // publishedDate is also from NewsAPI
        }));
        setArticles(articlesWithIds);
      } else {
        setArticles([]);
        toast({
          title: "No Articles Found",
          description: "Try adjusting your search query for different results.",
        });
      }
    } catch (e: any) {
      console.error("Failed to fetch news feed:", e);
      let friendlyMessage = "Failed to fetch news. Please check your connection or API configuration.";
      if (e.message && e.message.includes("NEWS_API_KEY")) {
        friendlyMessage = "NewsAPI key is missing or invalid. Please check your .env file and ensure NEWS_API_KEY is set correctly.";
      } else if (e.message) {
        friendlyMessage = `Failed to fetch news: ${e.message.substring(0,100)}${e.message.length > 100 ? '...' : ''}`;
      }
      setError(friendlyMessage);
      toast({
        title: "Error Fetching News",
        description: friendlyMessage.length > 100 ? "There was a problem connecting to the news service. See console for details." : friendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("Fetching live news articles..."); 
    }
  };

  const handleRetryFetch = () => {
    if (initialFormValues) {
      const lastInput = localStorage.getItem(FEED_PREFERENCES_KEY);
      let prefsToFetch: GenerateNewsFeedInput;
      if (lastInput) {
        prefsToFetch = JSON.parse(lastInput);
      } else {
         prefsToFetch = { 
            searchQuery: initialFormValues.searchQuery || "latest technology AI",
            numberOfArticles: initialFormValues.numberOfArticles || DEFAULT_NUMBER_OF_ARTICLES
          };
      }
      fetchNews(prefsToFetch);
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
          <p className="mt-4 text-lg text-muted-foreground">{loadingMessage}</p>
        </div>
      )}

      {error && !isLoading && (
        <Card className="my-8 text-center bg-card border-border shadow-xl max-w-md mx-auto">
          <CardHeader>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl text-foreground">News Feed Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleRetryFetch} variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Retry
            </Button>
          </CardFooter>
        </Card>
      )}

      {!isLoading && !error && articles.length === 0 && (
         initialFormValues && ( 
        <div className="flex flex-col items-center justify-center my-12 text-center">
          <ListX className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2 text-foreground">No Articles Yet</h2>
          <p className="text-muted-foreground">
            Enter search terms above and press Enter to generate your feed, or adjust your query.
          </p>
        </div>
        )
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
