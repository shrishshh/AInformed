"use client";
import Link from "next/link";
import { Github, Linkedin } from "lucide-react";
import Image from "next/image";
import ProfileCard from "../../components/ProfileCard";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-4xl font-extrabold mb-2 tracking-tight text-primary">About Us</h2>
      <p className="text-lg text-muted-foreground mb-8">Meet the creators behind AInformed</p>
      {/* Profile Images as Cards */}
      <div className="flex flex-col md:flex-row gap-8 mb-6 items-center justify-center">
        <ProfileCard
          name="Aryaman"
          title="Founder, Developer"
          handle="aryaman"
          status="Online"
          contactText="Contact Me"
          avatarUrl="/WhatsApp Image 2025-07-20 at 22.08.34_c5566474.jpg"
          showUserInfo={true}
          enableTilt={true}
          contactUrl="https://www.linkedin.com/in/aryamankachroo/"
        />
        <ProfileCard
          name="Shrish"
          title="Co-Founder, Developer"
          handle="shrish"
          status="Online"
          contactText="Contact Me"
          avatarUrl="/WhatsApp Image 2025-07-20 at 22.44.29_1edb67aa.jpg"
          showUserInfo={true}
          enableTilt={true}
          contactUrl="https://www.linkedin.com/in/shrishshh/"
        />
      </div>
      <h1 className="text-3xl font-bold mb-2">AInformed</h1>
      <p className="text-muted-foreground text-center max-w-2xl mb-6">
      Hi! We're Aryaman and Shrish, AI enthusiasts and developers passionate about building modern web apps and sharing the latest in artificial intelligence. We love exploring new technologies, collaborating on open source, and making AI accessible to everyone.<br /><br />
        <span className="font-semibold">Fun Fact:</span> We can code for hours with just coffee and lo-fi beats!
      </p>
      
      {/* Company Contact Information */}
      <div className="mb-8 w-full max-w-2xl">
        <h3 className="text-xl font-semibold mb-4 text-primary text-center">Connect With Us</h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <a
            href="mailto:sidemindlabs@gmail.com"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-base font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            sidemindlabs@gmail.com
          </a>
          <a
            href="https://www.linkedin.com/company/sidemindlabs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-base font-medium"
            aria-label="SideMindLabs LinkedIn"
          >
            <Linkedin className="h-5 w-5" />
            LinkedIn
          </a>
        </div>
      </div>
      
      <Link href="/contact">
      </Link>
    </div>
  );
} 