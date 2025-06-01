import { Card as TrendingCard, CardContent as TrendingCardContent, CardHeader as TrendingCardHeader, CardTitle as TrendingCardTitle } from "@/components/ui/card"
import { Badge as TrendingBadge } from "@/components/ui/badge"
import { TrendingUp as TrendingUpIcon, Hash, ArrowRight } from "lucide-react"
import { UiArticle } from "@/components/featured-articles"; // Import UiArticle type

// Define the props for TrendingTopics
export function TrendingTopics({ articles, onTopicClick }: { articles: UiArticle[], onTopicClick: (topic: string) => void }) {
  // Keep static trending topics for now, as dynamic calculation is complex
  // TODO: Implement dynamic trending topics based on article data (e.g., keyword frequency)
  const trendingTopics = [
    { topic: "GPT-5", posts: 1247, growth: "+23%" },
    { topic: "Quantum AI", posts: 892, growth: "+18%" },
    { topic: "AI Ethics", posts: 756, growth: "+15%" },
    { topic: "Autonomous Vehicles", posts: 634, growth: "+12%" },
    { topic: "Neural Networks", posts: 523, growth: "+8%" },
  ]

  // Use the first few articles for Recent Updates
  const recentUpdates = articles.slice(0, 4); // Take the first 4 articles

  return (
    <div className="space-y-6">
      <TrendingCard>
        <TrendingCardHeader>
          <TrendingCardTitle className="flex items-center space-x-2">
            <TrendingUpIcon className="h-5 w-5 text-red-500" />
            <span>Trending Topics</span>
          </TrendingCardTitle>
        </TrendingCardHeader>
        <TrendingCardContent className="space-y-4">
          {/* Display static trending topics for now */}
          {trendingTopics.map((item, index) => (
            <div
              key={item.topic}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onTopicClick(item.topic)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                <div>
                  <div className="font-medium">{item.topic}</div>
                  <div className="text-sm text-muted-foreground">{item.posts} posts</div>
                </div>
              </div>
              <TrendingBadge variant="secondary" className="text-green-600">
                {item.growth}
              </TrendingBadge>
            </div>
          ))}
        </TrendingCardContent>
      </TrendingCard>
    </div>
  )
} 