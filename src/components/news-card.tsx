"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { Bookmark, Share2, MessageSquare, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NewsCardProps {
  id: string
  title: string
  summary: string
  imageUrl: string
  source: string
  date: Date
  url: string
  readTime?: number
}

export function NewsCard({ id, title, summary, imageUrl, source, date, url, readTime = 3 }: NewsCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)

  // Ensure date is a Date object
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md border-0 bg-card">
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={imageUrl || "/placeholder.svg?height=400&width=600"}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-3 right-3">
            <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white" asChild>
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
          <time dateTime={dateObj.toISOString()}>{formatDistanceToNow(dateObj, { addSuffix: true })}</time>
          <span>•</span>
          <span>{readTime} min read</span>
        </div>

        <Link href={`/article/${id}`}>
          <h3 className="text-lg font-semibold leading-tight mb-2 hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
        </Link>

        <p className="text-sm text-muted-foreground line-clamp-3">{summary}</p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                >
                  <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-primary text-primary" : ""}`} />
                  <span className="sr-only">Bookmark</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isBookmarked ? "Remove bookmark" : "Save for later"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MessageSquare className="h-4 w-4" />
                  <span className="sr-only">Comments</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View comments</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Share2 className="h-4 w-4" />
                  <span className="sr-only">Share</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share article</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Button variant="ghost" size="sm" asChild>
          <Link href={`/article/${id}`}>Read More</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
