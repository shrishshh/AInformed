"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import TimeAgo from "@/components/common/TimeAgo"
import { Bookmark, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import SpotlightCard from "./SpotlightCard";
import TiltedCard from "./TiltedCard";
// import NewsSourceBadge from "./NewsSourceBadge";

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
  _isRSS?: boolean
  _isGNews?: boolean
  _isGDELT?: boolean
  _isHN?: boolean // Added HN prop
}

export function NewsCard({
  id,
  title,
  summary,
  imageUrl,
  source,
  date,
  url,
  readTime = 3,
  isBookmarked,
  onToggleBookmark,
  _isRSS,
  _isGNews,
  _isGDELT,
  _isHN // Added HN prop
}: NewsCardProps) {
  // Ensure date is a Date object
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const [imageError, setImageError] = useState(false);

  // Decode HTML entities in image URLs (safeguard)
  const decodeHtmlEntities = (str: string): string => {
    if (!str) return '';
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');
  };

  // Generate fallback image based on source
  const getFallbackImage = () => {
    // Decode HTML entities in imageUrl first
    const decodedImageUrl = imageUrl ? decodeHtmlEntities(imageUrl) : '';
    
    if (imageError || !decodedImageUrl || decodedImageUrl === '/placeholder.svg' || decodedImageUrl === '') {
      // Use generic tech images without "AI" text graphics
      // Abstract tech/circuit/digital patterns that don't contain text
      const genericTechImages = [
        'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=600&q=80', // Abstract tech pattern
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80', // Digital network
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80', // Abstract data visualization
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80', // Circuit board pattern
      ];
      
      // Create a simple hash from the URL/title to get a consistent but varied image index
      // This ensures different articles get different fallback images
      const hashString = (url || id || title || '').toString();
      let hash = 0;
      for (let i = 0; i < hashString.length; i++) {
        const char = hashString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      const imageIndex = Math.abs(hash) % genericTechImages.length;
      return genericTechImages[imageIndex] || genericTechImages[0];
    }
    
    return decodedImageUrl;
  };

  // Card click handler
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent click if clicking on bookmark or read more
    if ((e.target as HTMLElement).closest('.bookmark-btn, .readmore-btn')) return;
    window.open(url, '_blank');
  };

  // Handle image error
  const handleImageError = () => {
    console.warn(`Failed to load image for article: ${title} from ${imageUrl}. Using fallback.`);
    setImageError(true);
  };

  // Log image URL on mount for debugging
  useEffect(() => {
    if (imageUrl && imageUrl !== '/placeholder.svg' && imageUrl !== '') {
      console.log(`NewsCard image URL for "${title}":`, imageUrl);
    } else {
      console.log(`NewsCard "${title}": No image URL, will use fallback`);
    }
  }, [imageUrl, title]);

  return (
    <SpotlightCard className="custom-spotlight-card h-full" spotlightColor="rgba(0, 229, 255, 0.1)">
      <TiltedCard
        containerHeight="100%"
        containerWidth="100%"
        scaleOnHover={1.01} // Very subtle scale
        rotateAmplitude={2} // Very subtle rotation
        showMobileWarning={false}
        showTooltip={false}
      >
  <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl border-0 bg-card hover:border-primary/30 cursor-pointer hover:scale-[1.03] hover:-translate-y-2 shadow-sm" onClick={handleCardClick}>
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={getFallbackImage()}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
          onError={handleImageError}
          quality={85}
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute bottom-3 right-3 pointer-events-auto">
            <Button variant="default" size="sm" asChild>
              <Link href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Read Original
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
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
        <div className="mt-auto" />
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <Button
          variant={isBookmarked ? "default" : "outline"}
          size="icon"
          type="button"
          disabled={false}
          className={`bookmark-btn transition-all duration-200 relative z-10 ${
            isBookmarked 
              ? "bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg border-0" 
              : "border-2 border-purple-500/50 hover:border-purple-600 bg-background hover:bg-purple-50 dark:hover:bg-purple-950/20"
          }`}
          onClick={(e) => { 
            console.log('Bookmark button clicked!');
            e.stopPropagation(); 
            e.preventDefault();
            if (onToggleBookmark) {
              console.log('Calling onToggleBookmark with data:', { id, title, summary, imageUrl, source, date, url, readTime });
              onToggleBookmark({ id, title, summary, imageUrl, source, date, url, readTime });
            } else {
              console.warn('onToggleBookmark is not defined!');
            }
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          aria-label={isBookmarked ? "Unsave article" : "Save article"}
        >
          <Bookmark 
            className={`h-5 w-5 transition-all duration-200 ${
              isBookmarked 
                ? "fill-white text-white" 
                : "fill-none text-purple-600 dark:text-purple-400"
            }`} 
          />
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          className="readmore-btn" 
          onClick={e => {
            e.stopPropagation();
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
          asChild
        >
          <Link href={url} target="_blank" rel="noopener noreferrer">
            Read More
          </Link>
        </Button>
      </CardFooter>
    </Card>
      </TiltedCard>
    </SpotlightCard>
  )
}

// Alternative version without TiltedCard animation (uncomment if issues persist):
/*
export function NewsCard({ 
  id, 
  title, 
  summary, 
  imageUrl, 
  source, 
  date, 
  url, 
  readTime = 3, 
  isBookmarked, 
  onToggleBookmark,
  _isRSS,
  _isGNews,
  _isGDELT
}: NewsCardProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const [showSummary, setShowSummary] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getFallbackImage = () => {
    if (imageError || !imageUrl || imageUrl === '/placeholder.svg') {
      const sourceLower = source.toLowerCase();
      
      if (sourceLower.includes('techcrunch') || sourceLower.includes('venturebeat')) {
        return 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80';
      }
      
      if (sourceLower.includes('wired') || sourceLower.includes('ars technica')) {
        return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80';
      }
      
      if (sourceLower.includes('mit') || sourceLower.includes('tech review')) {
        return 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80';
      }
      
      if (sourceLower.includes('verge') || sourceLower.includes('engadget')) {
        return 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=600&q=80';
      }
      
      return 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80';
    }
    
    return imageUrl;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.bookmark-btn, .readmore-btn')) return;
    window.open(url, '_blank');
  };

  const handleImageError = () => {
    console.warn(`Failed to load image for article: ${title} from ${imageUrl}. Using fallback.`);
    setImageError(true);
  };

  return (
    <SpotlightCard className="custom-spotlight-card" spotlightColor="rgba(0, 229, 255, 0.1)">
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md border-0 bg-card cursor-pointer" onClick={handleCardClick}>
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={getFallbackImage()}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
            onError={handleImageError}
            unoptimized={imageUrl.startsWith('https://images.unsplash.com')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute bottom-3 right-3 pointer-events-auto">
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
    </SpotlightCard>
  )
}
*/
