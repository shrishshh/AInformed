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
    { icon: Linkedin, href: "https://www.linkedin.com/company/sidemindlabs", label: "SideMindLabs LinkedIn" },
  ];

  return (
    <footer className="bg-card border-t border-border mt-12 min-h-[120px] flex flex-col justify-end">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mr-2">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
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
            <h4 className="font-semibold mb-3 text-left">Categories</h4>
            <ul className="space-y-2">
              {footerLinks.Categories.map((cat) => (
                <li key={cat}>
                  <Link href={`/categories/${encodeURIComponent(cat)}`} className="hover:text-primary transition-colors text-sm">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-left">Resources</h4>
            <ul className="space-y-2 mb-4">
              {footerLinks.Resources.map((res) => (
                <li key={res}>
                  <Link 
                    href={res === "Research Papers" ? "/research-papers" : res === "AI Tools" ? "/ai-tools" : "#"}
                    className="hover:text-primary transition-colors text-sm"
                  >
                    {res}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-left">Legal & About</h4>
            <ul className="space-y-2">
              <li><Link href="/terms" className="hover:text-primary transition-colors text-sm">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors text-sm">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors text-sm">Contact</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <Separator />
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground min-h-[40px]">
        <span>&copy; {new Date().getFullYear()} AInformed. All rights reserved.</span>
        <div className="flex gap-4 mt-2 md:mt-0">
          <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
} 