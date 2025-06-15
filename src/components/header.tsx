"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Menu, X, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { useAuthStatus } from "@/hooks/useAuthStatus"

export default function Header() {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [search, setSearch] = useState("");
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isLoggedIn, logout } = useAuthStatus();

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mr-2">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hidden sm:inline-block">
              AInformed
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 ml-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/categories" className="text-sm font-medium hover:text-primary transition-colors">
              Categories
            </Link>
            <Link href="/trending" className="text-sm font-medium hover:text-primary transition-colors">
              Trending
            </Link>
            <Link href="/bookmarks" className="text-sm font-medium hover:text-primary transition-colors">
              Bookmarks
            </Link>
          </nav>
        </div>

        {/* Desktop Search & Actions */}
        <form onSubmit={handleSearch} className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search AI news..."
            className="pl-10 pr-4 w-full focus-visible:ring-purple-500"
          />
        </form>

        {/* Theme Toggle - Conditionally rendered after mount */}
        {mounted && (
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        )}

        {isLoggedIn ? (
          <Button
            variant="default"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            onClick={handleLogout}
          >
            Logout
          </Button>
        ) : (
          <Link href="/auth">
            <Button
              variant="default"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Sign In
            </Button>
          </Link>
        )}
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
            <Link
              href="/trending"
              className="flex items-center gap-2 text-sm font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Trending
            </Link>
            <Link
              href="/bookmarks"
              className="flex items-center gap-2 text-sm font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Bookmarks
            </Link>
          </nav>

          <div className="pt-4 border-t flex items-center justify-between">
            {/* Theme Toggle - Conditionally rendered after mount */}
            {mounted && (
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
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
