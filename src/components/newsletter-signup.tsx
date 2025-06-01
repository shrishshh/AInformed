import { Button as NewsletterButton } from "@/components/ui/button"
import { Input as NewsletterInput } from "@/components/ui/input"
import { Card as NewsletterCard, CardContent as NewsletterCardContent } from "@/components/ui/card"
import { Mail, CheckCircle } from "lucide-react"

export function NewsletterSignup() {
  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="container mx-auto px-4">
        <NewsletterCard className="max-w-4xl mx-auto border-0 shadow-2xl">
          <NewsletterCardContent className="p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold">Stay Informed</h2>
                </div>
                <p className="text-lg text-muted-foreground">
                  Get the latest AI news, research breakthroughs, and industry insights delivered to your inbox every
                  week.
                </p>
                <div className="space-y-3">
                  {[
                    "Weekly AI news roundup",
                    "Exclusive research insights",
                    "Industry expert interviews",
                    "Early access to reports",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <NewsletterInput type="email" placeholder="Enter your email address" className="h-12 text-lg" />
                  <NewsletterButton size="lg" className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">
                    Subscribe to Newsletter
                  </NewsletterButton>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Join 50,000+ AI enthusiasts. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </NewsletterCardContent>
        </NewsletterCard>
      </div>
    </section>
  )
} 