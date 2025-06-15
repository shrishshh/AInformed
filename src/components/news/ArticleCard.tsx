"use client";

import type { NewsArticle } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReliabilityBadge } from "./ReliabilityBadge";
import { Bookmark, BookmarkCheck, ExternalLink, FileText, Heart } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { summarizeArticle, SummarizeArticleInput } from "@/ai/flows/summarize-article";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LoadingSpinner } from "../common/LoadingSpinner";
import Link from "next/link";

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
      <div className="relative h-48 w-full">
        <Image
          src={article.imageUrl || "/placeholder.jpg"}
          alt={imageAlt}
          fill
          className="object-cover rounded-md"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={true}
          onError={e => {
            e.currentTarget.src = "/placeholder.jpg";
          }}
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
            {isSaved ? <Heart fill="red" className="h-5 w-5 text-red-500" /> : <Heart className="h-5 w-5 text-muted-foreground" />}
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

