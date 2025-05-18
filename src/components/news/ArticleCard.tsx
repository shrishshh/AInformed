
"use client";

import type { NewsArticle } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReliabilityBadge } from "./ReliabilityBadge";
import { Bookmark, BookmarkCheck, ExternalLink, FileText, Hourglass } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { summarizeArticle, SummarizeArticleInput } from "@/ai/flows/summarize-article";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface ArticleCardProps {
  article: NewsArticle;
  isSaved: boolean;
  onToggleSave: (article: NewsArticle) => void;
}

export function ArticleCard({ article, isSaved, onToggleSave }: ArticleCardProps) {
  const { toast } = useToast();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setAiSummary(null);
    try {
      const input: SummarizeArticleInput = { articleContent: article.summary }; // Summarizing the existing summary
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

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {article.imageUrl && (
        <div className="relative w-full h-48">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill={true}
            className="object-cover"
            data-ai-hint={article.dataAiHint || "news article"}
            priority={false} // It's okay to set priority false for many images on a page
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-semibold leading-tight">{article.title}</CardTitle>
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
      <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-t">
        <ReliabilityBadge score={article.reliabilityScore} />
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isSummarizing}>
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
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>AI Generated Summary</AlertDialogTitle>
              <AlertDialogDescription className="max-h-[60vh] overflow-y-auto text-sm text-foreground py-2">
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
