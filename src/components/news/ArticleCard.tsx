
"use client";

import type { NewsArticle } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReliabilityBadge } from "./ReliabilityBadge";
import { Bookmark, BookmarkCheck, ExternalLink, FileText } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { summarizeArticle, SummarizeArticleInput } from "@/ai/flows/summarize-article";
import { useState, useEffect } from "react"; // Added useEffect here
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface ArticleCardProps {
  article: NewsArticle;
  isSaved: boolean;
  onToggleSave: (article: NewsArticle) => void;
}

// A generic fallback image as a data URI (SVG)
const FALLBACK_IMAGE_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiMzNzQxNTEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjRweCIgZmlsbD0iI2EwYTVhZSI+Tm8gSW1hZ2UgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';


export function ArticleCard({ article, isSaved, onToggleSave }: ArticleCardProps) {
  const { toast } = useToast();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(article.imageUrl || FALLBACK_IMAGE_PLACEHOLDER);

  // Update image if article.imageUrl changes and is valid
  useEffect(() => { // Changed from React.useEffect to useEffect
    setCurrentImageUrl(article.imageUrl || FALLBACK_IMAGE_PLACEHOLDER);
  }, [article.imageUrl]);


  const handleSummarize = async () => {
    setIsSummarizing(true);
    setAiSummary(null);
    try {
      const contentToSummarize = article.summary || article.title;
      if (!contentToSummarize) {
        toast({
          title: "Summarization Failed",
          description: "Article content is missing.",
          variant: "destructive",
        });
        setIsSummarizing(false);
        return;
      }
      const input: SummarizeArticleInput = { articleContent: contentToSummarize };
      const result = await summarizeArticle(input);
      setAiSummary(result.summary);
      setShowSummaryModal(true);
      toast({
        title: "Article Summarized",
        description: "AI summary generated successfully.",
      });
    } catch (error) {
      console.error("Error summarizing article:", error);
      toast({
        title: "Summarization Failed",
        description: "Could not generate AI summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSummarizing(false);
    }
  };
  
  const imageAlt = article.title || "News article image";

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card">
      <div className="relative w-full h-48 bg-muted">
        <Image
          src={currentImageUrl}
          alt={imageAlt}
          fill={true}
          className="object-cover"
          priority={false} // Lower priority for feed images
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => {
            console.warn(`Failed to load image for article: ${article.title} from ${article.imageUrl}. Using fallback.`);
            setCurrentImageUrl(FALLBACK_IMAGE_PLACEHOLDER);
          }}
          unoptimized={currentImageUrl.startsWith('data:image')} // Avoid optimization for data URIs
        />
      </div>
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-semibold leading-tight text-foreground">{article.title}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleSave(article)}
            aria-label={isSaved ? "Unsave article" : "Save article"}
            className="text-primary hover:text-primary/80 shrink-0"
          >
            {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
          </Button>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Source: {article.source}
          {article.publishedDate && ` • ${new Date(article.publishedDate).toLocaleDateString()}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-4">{article.summary}</p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-t border-border">
        <ReliabilityBadge score={article.reliabilityScore} />
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isSummarizing || !article.summary}>
            {isSummarizing ? <LoadingSpinner size={16} className="mr-2" /> : <FileText className="mr-2 h-4 w-4" />}
            Summarize
          </Button>
          <Button variant="default" size="sm" asChild>
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Read More
            </a>
          </Button>
        </div>
      </CardFooter>

      {showSummaryModal && aiSummary && (
         <AlertDialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
          <AlertDialogContent className="bg-background border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">AI Generated Summary</AlertDialogTitle>
              <AlertDialogDescription className="max-h-[60vh] overflow-y-auto text-sm text-muted-foreground py-2">
                {aiSummary}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowSummaryModal(false)}>Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}

