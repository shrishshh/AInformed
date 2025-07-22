"use client";
import Link from "next/link";
import { Github, Linkedin } from "lucide-react";
import Image from "next/image";
import ProfileCard from "../../components/ProfileCard";

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
      <h1 className="text-3xl font-bold mb-2">SideMindLabs</h1>
      <p className="text-muted-foreground text-center max-w-2xl mb-6">
      Hi! We're Aryaman and Shrish, AI enthusiasts and developers passionate about building modern web apps and sharing the latest in artificial intelligence. We love exploring new technologies, collaborating on open source, and making AI accessible to everyone.<br /><br />
        <span className="font-semibold">Fun Fact:</span> We can code for hours with just coffee and lo-fi beats!
      </p>
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2 text-primary">Skills & Technologies</h3>
        <ul className="flex flex-wrap gap-3 justify-center text-sm text-muted-foreground">
          <li className="bg-card px-3 py-1 rounded shadow">React</li>
          <li className="bg-card px-3 py-1 rounded shadow">Next.js</li>
          <li className="bg-card px-3 py-1 rounded shadow">TypeScript</li>
          <li className="bg-card px-3 py-1 rounded shadow">Tailwind CSS</li>
          <li className="bg-card px-3 py-1 rounded shadow">Firebase</li>
          {/* <li className="bg-card px-3 py-1 rounded shadow">Python</li> */}
          <li className="bg-card px-3 py-1 rounded shadow">APIs</li>
        </ul>
      </div>
      {/* <div className="flex gap-4 mb-8">
        <a href="https://github.com/shrishshh" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <Github className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors" />
        </a>
        <a href="https://linkedin.com/in/shrishshh" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <Linkedin className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors" />
        </a>
      </div> */}
      <Link href="/contact">
      </Link>
    </div>
  );
} 