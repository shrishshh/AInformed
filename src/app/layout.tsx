import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import { Inter as FontSans } from "next/font/google"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/ui/theme-provider"
import Header from "@/components/header"
import { Footer } from "@/components/footer"
import "./globals.css"
import { Toaster } from "sonner"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ainformed.in'),
  title: "AInformed – Latest AI News, Updates, Breakthroughs & Tools",
  description: "AInformed gives you the latest artificial intelligence news, breakthroughs, research, and trending AI tools in real-time. Stay updated with everything happening in the world of AI.",
  keywords: ["AI news", "artificial intelligence news", "latest AI tools", "machine learning updates", "AI research", "AInformed", "tech news", "AI breakthroughs"],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.ainformed.in/",
  },
  // Google Search Console Verification
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'KeaQXplRTuZC3gbH6O8q2tmkRmXp4cbBMzlJSrCndQA',
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  openGraph: {
    title: "AInformed – Latest AI News & Trends",
    description: "Stay informed with daily AI updates, research, tools, and innovations from trusted sources.",
    url: "https://www.ainformed.in/",
    siteName: "AInformed",
    images: [
      {
        url: "https://www.ainformed.in/og-image.png",
        width: 1200,
        height: 630,
        alt: "AInformed - Latest AI News & Trends"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AInformed – Latest AI News & Innovations",
    description: "Daily coverage of the latest AI tools, research, and breakthroughs.",
    images: ["https://www.ainformed.in/og-image.png"],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Suspense fallback={<div className="h-16 border-b bg-background/80" />}>
            <Header />
          </Suspense>
          <main>{children}</main>
          <Footer />
          <Toaster 
            richColors 
            position="top-center" 
            closeButton 
            duration={3000}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
