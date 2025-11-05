"use client"

import Link from "next/link";
import { ArrowLeft, Lightbulb, TrendingUp, BookOpen } from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AiToolsPage() {
  const aiTools = [
    {
      name: "ChatGPT",
      description: "A powerful AI chatbot for various tasks, from writing to coding.",
      link: "https://openai.com/chatgpt/",
      icon: <Lightbulb className="h-5 w-5" />,
    },
    {
      name: "DALL-E 3",
      description: "AI image generation from text prompts.",
      link: "https://openai.com/dall-e-3/",
      icon: <Lightbulb className="h-5 w-5" />,
    },
    {
      name: "Midjourney",
      description: "An independent research lab exploring new mediums of thought and expanding the imaginative powers of the human species.",
      link: "https://www.midjourney.com/",
      icon: <Lightbulb className="h-5 w-5" />,
    },
    {
      name: "TensorFlow",
      description: "An open-source machine learning platform.",
      link: "https://www.tensorflow.org/",
      icon: <Lightbulb className="h-5 w-5" />,
    },
    {
      name: "PyTorch",
      description: "An open-source machine learning framework.",
      link: "https://pytorch.org/",
      icon: <Lightbulb className="h-5 w-5" />,
    },
    {
      name: "Hugging Face",
      description: "Platform for building, training and deploying ML models.",
      link: "https://huggingface.co/",
      icon: <Lightbulb className="h-5 w-5" />,
    },
    {
      name: "Google AI Platform",
      description: "Suite of AI and ML services on Google Cloud.",
      link: "https://cloud.google.com/ai-platform",
      icon: <Lightbulb className="h-5 w-5" />,
    },
    {
      name: "Microsoft Azure AI",
      description: "Cloud-based AI services and tools.",
      link: "https://azure.microsoft.com/en-us/solutions/ai/",
      icon: <Lightbulb className="h-5 w-5" />,
    },
    {
      name: "IBM Watson",
      description: "Enterprise AI tools and applications.",
      link: "https://www.ibm.com/watson",
      icon: <Lightbulb className="h-5 w-5" />,
    },
  ];

  return (
    <div className="container px-4 py-8 mx-auto">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-4">AI Tools</h1>
      <p className="text-muted-foreground mb-8">
        Explore a curated list of powerful AI tools and platforms.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiTools.map((tool) => (
          <a
            key={tool.name}
            href={tool.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1"
          >
            <div className="mb-4 text-primary">{tool.icon}</div>
            <h2 className="text-xl font-semibold text-foreground mb-2 text-center">{tool.name}</h2>
            <p className="text-sm text-muted-foreground text-center">{tool.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
} 