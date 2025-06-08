import Link from "next/link"
import { TrendingUp, Clock, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface TrendingTopic {
  id: string
  name: string
  posts: number
  change: string
}

interface RecentUpdate {
  id: string
  title: string
  date: string
}

interface TrendingSidebarProps {
  trendingTopics: TrendingTopic[]
  recentUpdates: RecentUpdate[]
}

export function TrendingSidebar({ trendingTopics, recentUpdates }: TrendingSidebarProps) {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {trendingTopics.map((topic, index) => (
              <Link key={topic.id} href={`/topic/${topic.id}`} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">{topic.name}</p>
                    <p className="text-xs text-muted-foreground">{topic.posts} posts</p>
                  </div>
                </div>
                <Badge
                  variant={topic.change.startsWith("+") ? "default" : "secondary"}
                  className={`${
                    topic.change.startsWith("+")
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  }`}
                >
                  {topic.change}
                </Badge>
              </Link>
            ))}
          </div>

          <Button variant="ghost" size="sm" className="w-full mt-4" asChild>
            <Link href="/topics">
              View all topics
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {recentUpdates.map((update) => (
              <Link key={update.id} href={`/article/${update.id}`} className="block group">
                <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                  {update.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{update.date}</p>
              </Link>
            ))}
          </div>

          <Button variant="ghost" size="sm" className="w-full mt-4" asChild>
            <Link href="/recent">
              View all updates
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
