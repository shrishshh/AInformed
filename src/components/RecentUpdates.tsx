import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Hash } from "lucide-react";

// Define a basic interface for the raw article data expected from page.tsx
interface ApiArticleData {
  title: string;
  description: string;
  source: { name: string; };
  url: string;
  image?: string | null;
  publishedAt: string;
}

interface RecentUpdatesProps {
  articles: ApiArticleData[]; // Use ApiArticleData[]
}

export function RecentUpdates({ articles }: RecentUpdatesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Hash className="h-5 w-5 text-blue-500" />
          <span>Recent Updates</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          {articles.map((update) => (
            <a
              key={update.url}
              href={update.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
            >
              <div className="space-y-1">
                {/* Use article title and time */}
                <div className="font-medium text-sm group-hover:text-blue-600 transition-colors line-clamp-2">{update.title}</div>
                {/* Use formatted publishedAt for time */}
                <div className="text-xs text-muted-foreground">{new Date(update.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Keeping the arrow icon */}
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 