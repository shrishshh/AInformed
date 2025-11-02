"use client";

import { Separator } from "@/components/ui/separator";
import { Linkedin } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const footerLinks = {
    Categories: [
      "Artificial Intelligence",
      "Machine Learning",
      "Data Science",
      "Cybersecurity",
      "Robotics",
      "Natural Language Processing",
    ],
    Resources: [
      "Research Papers",
      "AI Tools",
    ],
  };

  const socialLinks = [
    { icon: Linkedin, href: "https://www.linkedin.com/company/sidemindlabs", label: "LinkedIn", color: "hover:text-blue-600" },
  ];

  return (
    <footer className="bg-background border-t border-border/50 mt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-2xl font-bold">AInformed</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
              Your trusted source for the latest artificial intelligence news, research, and insights. Stay informed about the rapidly evolving world of AI.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map(({ icon: Icon, href, label, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`text-muted-foreground ${color} transition-colors cursor-pointer`}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Categories</h4>
            <ul className="space-y-3">
              {footerLinks.Categories.map((cat) => (
                <li key={cat}>
                  <Link 
                    href={`/categories/${encodeURIComponent(cat)}`} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.Resources.map((res) => (
                <li key={res}>
                  <Link 
                    href={res === "Research Papers" ? "/research-papers" : res === "AI Tools" ? "/ai-tools" : "#"}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {res}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link></li>
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link></li>
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>
            &copy; {new Date().getFullYear()} AInformed. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs">Powered by SideMindLabs • Made for the community</span>
          </div>
        </div>
      </div>
    </footer>
  );
} 