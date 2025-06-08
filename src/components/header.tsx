"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Bell, Menu, X, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"

export default function Header() {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

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
        <div className="hidden md:flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search AI news..."
              className="pl-10 pr-4 w-full focus-visible:ring-purple-500"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-medium">Notifications</h3>
                <Button variant="ghost" size="sm">
                  Mark all as read
                </Button>
              </div>
              <div className="py-2 px-4 text-sm text-muted-foreground">No new notifications</div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Link href="/auth">
            <Button
              variant="default"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Sign In
            </Button>
          </Link>
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
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600">Sign In</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
