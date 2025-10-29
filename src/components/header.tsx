"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Search, Menu, X, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { useAuthStatus } from "@/hooks/useAuthStatus"
import GooeyNav, { GooeyNavItem } from "./GooeyNav"

export default function Header() {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [search, setSearch] = useState("");
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isLoggedIn, logout } = useAuthStatus();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mr-2">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hidden sm:inline-block">
            AInformed
          </span>
        </Link>

        {/* Everything else on the right */}
        <div className="flex items-center gap-6 flex-1 justify-end ml-6">
          {/* Desktop Navigation */}
          <div className="hidden md:flex">
            <GooeyNav
              items={[
                { label: "Home", href: "/" },
                { label: "Categories", href: "/categories" },
              ]}
              particleCount={15}
              particleDistances={[90, 10]}
              particleR={100}
              initialActiveIndex={0}
              animationTime={600}
              timeVariance={300}
              colors={[1, 2, 3, 1, 2, 3, 1, 4]}
              activeHref={pathname}
            />
          </div>

          {/* Desktop Search & Actions */}
          <form onSubmit={handleSearch} className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search AI news..."
              className="pl-10 pr-4 w-full focus-visible:ring-purple-500"
            />
          </form>

          {/* Theme Toggle */}
          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle theme"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="flex md:hidden items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSearchExpanded(!isSearchExpanded)}
          className="relative"
        >
          <Search className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Search Bar */}
      {isSearchExpanded && (
        <div className="p-4 border-t md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search AI news..." className="pl-10 pr-4 w-full" autoFocus />
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t p-4 space-y-4 md:hidden bg-background">
          <nav className="flex flex-col space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/categories"
              className="flex items-center gap-2 text-sm font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Categories
            </Link>
          </nav>

          <div className="pt-4 border-t flex items-center justify-between">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle theme"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}

            {isLoggedIn ? (
              <Button
                className="bg-gradient-to-r from-purple-600 to-blue-600"
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
              >
                Logout
              </Button>
            ) : (
              <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
