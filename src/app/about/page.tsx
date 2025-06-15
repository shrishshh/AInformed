"use client";
import Link from "next/link";
import { Github, Linkedin } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-4xl font-extrabold mb-2 tracking-tight text-primary">About Us</h2>
      <p className="text-lg text-muted-foreground mb-8">Meet the creators behind AInformed</p>
      <img
        src="/profile.jpg"
        alt="shrish"
        className="w-40 h-40 rounded-full mb-6 border-4 border-primary shadow-lg object-cover object-center"
      />
      <h1 className="text-3xl font-bold mb-2">DE JIGGLE</h1>
      <p className="text-muted-foreground text-center max-w-2xl mb-6">
        Hi! I'm Ninnn JA and ZUCU, an AI enthusiast and developer passionate about building modern web apps and sharing the latest in artificial intelligence. I love exploring new technologies, collaborating on open source, and making AI accessible to everyone.<br /><br />
        <span className="font-semibold">Fun Fact:</span> I can code for hours with just coffee and lo-fi beats!
      </p>
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2 text-primary">Skills & Technologies</h3>
        <ul className="flex flex-wrap gap-3 justify-center text-sm text-muted-foreground">
          <li className="bg-card px-3 py-1 rounded shadow">React</li>
          <li className="bg-card px-3 py-1 rounded shadow">Next.js</li>
          <li className="bg-card px-3 py-1 rounded shadow">TypeScript</li>
          <li className="bg-card px-3 py-1 rounded shadow">Tailwind CSS</li>
          <li className="bg-card px-3 py-1 rounded shadow">Firebase</li>
          <li className="bg-card px-3 py-1 rounded shadow">Python</li>
          <li className="bg-card px-3 py-1 rounded shadow">AI/ML APIs</li>
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