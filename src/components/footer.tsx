import { Badge as FooterBadge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Github, Twitter, Linkedin, Rss } from "lucide-react"

export function Footer() {
  const footerLinks = {
    Categories: [
      "Machine Learning",
      "Robotics",
      "Natural Language Processing",
      "Computer Vision",
      "Ethics & Policy",
      "Industry News",
    ],
    Resources: ["Research Papers", "AI Tools", "Datasets", "Tutorials", "Glossary", "Events"],
    Company: ["About Us", "Our Team", "Careers", "Contact", "Press Kit", "Partnerships"],
    Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR", "Accessibility", "Disclaimer"],
  }

  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="font-bold text-xl">AI News Hub</span>
            </div>
            <p className="text-muted-foreground max-w-md">
              Your trusted source for the latest artificial intelligence news, research, and insights. Stay informed
              about the rapidly evolving world of AI.
            </p>
            <div className="flex items-center space-x-4">
              <FooterBadge variant="secondary" className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span>Live</span>
              </FooterBadge>
              <span className="text-sm text-muted-foreground">Updated every hour</span>
            </div>
            <div className="flex items-center space-x-4">
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-blue-500 cursor-pointer transition-colors" />
              <Linkedin className="h-5 w-5 text-muted-foreground hover:text-blue-600 cursor-pointer transition-colors" />
              <Github className="h-5 w-5 text-muted-foreground hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors" />
              <Rss className="h-5 w-5 text-muted-foreground hover:text-orange-500 cursor-pointer transition-colors" />
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">© 2024 AI News Hub. All rights reserved.</div>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <span>Made with ❤️ for the AI community</span>
            <FooterBadge variant="outline">v2.1.0</FooterBadge>
          </div>
        </div>
      </div>
    </footer>
  )
} 