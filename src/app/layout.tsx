import type React from "react"
import type { Metadata } from "next"
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
  title: "AInformed - AI News & Insights",
  description: "Stay updated with the latest AI news, trends, and insights",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "AInformed - AI News & Insights",
    description: "Stay updated with the latest AI news, trends, and insights",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://ainformed.app/",
    siteName: "AInformed",
    images: [
      {
        url: "/profile.jpg",
        width: 800,
        height: 600,
        alt: "AInformed logo"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AInformed - AI News & Insights",
    description: "Stay updated with the latest AI news, trends, and insights",
    images: ["/profile.jpg"],
    creator: "@ainformedapp"
  }
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
          <Header />
          <main>{children}</main>
          <Footer />
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
