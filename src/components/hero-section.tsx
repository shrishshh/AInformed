import { Badge as HeroBadge } from "@/components/ui/badge"
import { Button as HeroButton } from "@/components/ui/button"
import { ArrowRight, Clock as HeroClock, User as HeroUser } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <HeroBadge variant="secondary" className="w-fit">
              Breaking News
            </HeroBadge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              OpenAI Announces{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">GPT-5</span>{" "}
              with Revolutionary Capabilities
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              The latest breakthrough in artificial intelligence promises to transform how we interact with AI systems,
              featuring enhanced reasoning and multimodal understanding.
            </p>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <HeroUser className="h-4 w-4" />
                <span>Sarah Chen</span>
              </div>
              <div className="flex items-center space-x-2">
                <HeroClock className="h-4 w-4" />
                <span>2 hours ago</span>
              </div>
            </div>
            <HeroButton size="lg" className="group">
              Read Full Article
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </HeroButton>
          </div>
          <div className="relative">
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/placeholder.svg?height=400&width=600"
                alt="AI Technology Visualization"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 