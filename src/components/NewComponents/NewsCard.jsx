import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Bookmark, BookmarkCheck, Share2, ExternalLink, Sparkles } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const NewsCard = ({ article, onSave, onWordSelect }) => {
  const { toast } = useToast();
  const [hoveredWord, setHoveredWord] = useState(null);

  const handleSave = () => {
    onSave(article.id);
    toast({
      title: article.saved ? 'Article unsaved' : 'Article saved',
      description: article.saved 
        ? 'Removed from your saved articles' 
        : 'Added to your saved articles',
      duration: 2000,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
      }).catch(() => {});
    } else {
      toast({
        title: 'Link copied',
        description: 'Article link copied to clipboard',
        duration: 2000,
      });
    }
  };

  const handleReadFullArticle = () => {
    window.open(article.sourceUrl, '_blank', 'noopener,noreferrer');
  };

  const handleWordClick = (word) => {
    // Remove punctuation from word
    const cleanWord = word.replace(/[.,!?;:()]/g, '');
    if (cleanWord.length > 2) {
      onWordSelect(cleanWord);
    }
  };

  const renderInteractiveSummary = () => {
    // Split summary into words
    const words = article.summary.split(' ');
    
    return (
      <p className="text-gray-700 leading-relaxed">
        {words.map((word, index) => {
          const cleanWord = word.replace(/[.,!?;:()]/g, '');
          const isClickable = cleanWord.length > 2;
          
          return (
            <React.Fragment key={index}>
              {isClickable ? (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="hover:bg-blue-100 hover:text-blue-800 cursor-pointer rounded px-0.5 transition-all duration-150 hover:font-medium inline-block"
                        onClick={() => handleWordClick(word)}
                        onMouseEnter={() => setHoveredWord(cleanWord)}
                        onMouseLeave={() => setHoveredWord(null)}
                      >
                        {word}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-blue-500" />
                        <p className="text-xs">Click to get AI-powered definition</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span>{word}</span>
              )}
              {index < words.length - 1 && ' '}
            </React.Fragment>
          );
        })}
      </p>
    );
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? 's' : ''} ago`;
  };

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Image Section */}
      <div className="relative h-72 overflow-hidden">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-4 left-4">
          <Badge className="bg-white/90 text-black hover:bg-white">
            {article.category}
          </Badge>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="bg-white/90 hover:bg-white h-9 w-9"
            onClick={handleSave}
          >
            {article.saved ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="bg-white/90 hover:bg-white h-9 w-9"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Title */}
          <h2 className="text-2xl font-bold leading-tight text-gray-900">
            {article.title}
          </h2>

          {/* Interactive Summary */}
          <div className="relative">
            {renderInteractiveSummary()}
            
            {/* Hint about clickable words */}
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <Sparkles className="h-3 w-3" />
              <span>Hover over words to get AI definitions</span>
            </div>
          </div>

          {/* Read Full Article Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReadFullArticle}
            className="w-full mt-4 group"
          >
            <span>Read Full Article</span>
            <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
            <span className="font-medium">{article.source}</span>
            <span>{formatTimeAgo(article.timestamp)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewsCard;
