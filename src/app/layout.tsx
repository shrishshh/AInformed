
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist, Geist_Mono } from 'next/font/google';
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "AInformed - Your Smart News Aggregator",
  description: "AI-powered news aggregation and summarization by AInformed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}>
        <Header />
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
