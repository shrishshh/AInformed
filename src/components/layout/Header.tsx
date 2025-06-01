"use client";

import Link from "next/link";
import { Brain, Heart, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const toggleTheme = () => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  return (
    <header className="bg-card border-b border-border relative shadow-md">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600"></div>
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4 pt-1">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Brain className="h-8 w-8 text-pink-500" />
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              AInformed
            </span>
          </h1>
        </Link>

        <nav className="flex items-center gap-2 shrink-0">
           <Button variant="ghost" size="icon" asChild className={cn(pathname === "/saved" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}>
            <Link href={pathname === "/saved" ? "/" : "/saved"} aria-label="Saved Articles">
              <Heart className="h-6 w-6" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="text-muted-foreground hover:text-foreground">
            <Sun className="h-6 w-6" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
