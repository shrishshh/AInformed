import { Badge as FooterBadge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Github, Twitter, Linkedin, Rss } from "lucide-react";
import Link from "next/link";

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
    Resources: [
      "Research Papers",
      "AI Tools",
      "Datasets",
      "Tutorials",
      "Glossary",
      "Events",
    ],
  };

  const socialLinks = [
    { icon: Github, href: "https://github.com/", label: "GitHub" },
    { icon: Twitter, href: "https://twitter.com/", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com/", label: "LinkedIn" },
    { icon: Rss, href: "/rss.xml", label: "RSS" },
  ];

  return (
    <footer className="bg-card border-t border-border mt-12">
      <div className="container mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-6 gap-8">
        <div className="md:col-span-1 flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2 mb-2">
            <FooterBadge variant="secondary" className="text-lg px-3 py-1">AI</FooterBadge>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">AInformed</span>
          </Link>
          <p className="text-muted-foreground text-sm">
            Stay updated with the latest AI news, research, and resources.
          </p>
          <div className="flex gap-3 mt-2">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Categories</h4>
          <ul className="space-y-2">
            {footerLinks.Categories.map((cat) => (
              <li key={cat}>
                <Link href={`/categories?cat=${encodeURIComponent(cat)}`} className="hover:text-primary transition-colors text-sm">
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Resources</h4>
          <ul className="space-y-2">
            {footerLinks.Resources.map((res) => (
              <li key={res}>
                <Link href={`/resources?type=${encodeURIComponent(res)}`} className="hover:text-primary transition-colors text-sm">
                  {res}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Legal</h4>
          <ul className="space-y-2">
            <li><Link href="/terms" className="hover:text-primary transition-colors text-sm">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-primary transition-colors text-sm">Privacy Policy</Link></li>
            <li><Link href="/cookies" className="hover:text-primary transition-colors text-sm">Cookie Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">About</h4>
          <ul className="space-y-2">
            <li><Link href="/about" className="hover:text-primary transition-colors text-sm">About Me</Link></li>
            <li><Link href="/contact" className="hover:text-primary transition-colors text-sm">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Newsletter</h4>
          <p className="text-sm text-muted-foreground mb-2">Get the latest AI news delivered to your inbox.</p>
          <form className="flex flex-col gap-2">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <button
              type="submit"
              className="rounded-md bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-white text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-colors w-full"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
      <Separator />
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} AInformed. All rights reserved.</span>
        <div className="flex gap-4 mt-2 md:mt-0">
          <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
} 