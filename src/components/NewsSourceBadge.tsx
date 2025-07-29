import React from 'react';
import { Badge } from '@/components/ui/badge';

interface NewsSourceBadgeProps {
  source: string;
  isRSS?: boolean;
  isGNews?: boolean;
  isGDELT?: boolean;
  isHN?: boolean; // Added HN prop
}

export default function NewsSourceBadge({ source, isRSS, isGNews, isGDELT, isHN }: NewsSourceBadgeProps) {
  if (isRSS) {
    return (
      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200">
        RSS • {source}
      </Badge>
    );
  }

  if (isGNews) {
    return (
      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
        GNews • {source}
      </Badge>
    );
  }

  if (isGDELT) {
    return (
      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200">
        GDELT • {source}
      </Badge>
    );
  }

  if (isHN) { // Added HN badge
    return (
      <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 hover:bg-orange-200">
        HN • {source}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="text-xs">
      {source}
    </Badge>
  );
} 