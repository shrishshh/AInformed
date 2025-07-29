import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NewsSourceStatsProps {
  sources?: {
    gnews: number;
    rss: number;
    gdelt: number;
    hn: number; // Added HN count
    total: number;
  };
}

export default function NewsSourceStats({ sources }: NewsSourceStatsProps) {
  if (!sources) return null;

  const gnewsPercentage = Math.round((sources.gnews / sources.total) * 100);
  const rssPercentage = Math.round((sources.rss / sources.total) * 100);
  const gdeltPercentage = Math.round((sources.gdelt / sources.total) * 100);
  const hnPercentage = Math.round((sources.hn / sources.total) * 100); // Added HN percentage

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">News Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              GNews
            </Badge>
            <span className="text-sm text-muted-foreground">
              {sources.gnews} articles ({gnewsPercentage}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              RSS
            </Badge>
            <span className="text-sm text-muted-foreground">
              {sources.rss} articles ({rssPercentage}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              GDELT
            </Badge>
            <span className="text-sm text-muted-foreground">
              {sources.gdelt} articles ({gdeltPercentage}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              HN
            </Badge>
            <span className="text-sm text-muted-foreground">
              {sources.hn} stories ({hnPercentage}%)
            </span>
          </div>
          <div className="ml-auto text-sm text-muted-foreground">
            Total: {sources.total} articles
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 