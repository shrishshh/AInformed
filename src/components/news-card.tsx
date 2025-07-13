"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import TimeAgo from "@/components/common/TimeAgo"
import { Bookmark, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface NewsCardProps {
  id: string
  title: string
  summary: string
  imageUrl: string
  source: string
  date: Date | string
  url: string
  readTime?: number
  isBookmarked?: boolean
  onToggleBookmark?: (article: any) => void
}

export function NewsCard({ id, title, summary, imageUrl, source, date, url, readTime = 3, isBookmarked, onToggleBookmark }: NewsCardProps) {
  // Ensure date is a Date object
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const [showSummary, setShowSummary] = useState(false);

  // Card click handler
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent click if clicking on bookmark or read more
    if ((e.target as HTMLElement).closest('.bookmark-btn, .readmore-btn')) return;
    window.open(url, '_blank');
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md border-0 bg-card cursor-pointer" onClick={handleCardClick}>
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
          onError={e => {
            console.warn(`Failed to load image for article: ${title} from ${imageUrl}. Using fallback.`);
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-3 right-3">
            <Button variant="default" size="sm" asChild>
              <Link href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Read Original
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span className="font-medium">{source}</span>
          <span>•</span>
          <time dateTime={dateObj.toISOString()}>
            <TimeAgo date={dateObj} />
          </time>
          <span>•</span>
          <span>{readTime} min read</span>
        </div>

        <h3 className="text-lg font-semibold leading-tight mb-2 hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-3">{summary}</p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <Button
          variant="default"
          size="icon"
          className="bookmark-btn"
          onClick={e => { e.stopPropagation(); onToggleBookmark?.({ id, title, summary, imageUrl, source, date, url, readTime }); }}
          aria-label={isBookmarked ? "Unsave article" : "Save article"}
        >
          <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-primary text-primary" : "text-white"}`} />
        </Button>
        <Dialog open={showSummary} onOpenChange={open => { setShowSummary(open); }}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="readmore-btn" onClick={e => e.stopPropagation()}>
              Read More
            </Button>
          </DialogTrigger>
          <DialogContent onClick={e => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground whitespace-pre-line">{summary}</div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
