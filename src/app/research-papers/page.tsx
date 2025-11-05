"use client"

import Link from "next/link";
import { ArrowLeft, FileText, BookOpen } from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function ResearchPapersPage() {
  const researchPapers = [
    {
      title: "Attention Is All You Need",
      authors: "Ashish Vaswani, Noam Shazeer, Niki Parmar, et al.",
      year: "2017",
      abstract: "The paper that introduced the Transformer model, a foundational architecture for modern AI.",
      link: "https://arxiv.org/abs/1706.03762",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
      authors: "Jacob Devlin, Ming-Wei Chang, Kenton Lee, Kristina Toutanova",
      year: "2018",
      abstract: "Introduced BERT, a powerful language representation model based on Transformers.",
      link: "https://arxiv.org/abs/1810.04805",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "ImageNet Classification with Deep Convolutional Neural Networks",
      authors: "Alex Krizhevsky, Ilya Sutskever, Geoffrey E. Hinton",
      year: "2012",
      abstract: "A seminal paper that demonstrated the power of deep convolutional neural networks for image classification.",
      link: "https://proceedings.neurips.cc/paper/2012/file/c399862d3b4b57488a6ec156fd8a5099-Paper.pdf",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Generative Adversarial Nets",
      authors: "Ian Goodfellow, Jean Pouget-Abadie, Mehdi Mirza, et al.",
      year: "2014",
      abstract: "Introduced Generative Adversarial Networks (GANs), a framework for estimating generative models.",
      link: "https://arxiv.org/abs/1406.2661",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Playing Atari with Deep Reinforcement Learning",
      authors: "Volodymyr Mnih, Koray Kavukcuoglu, David Silver, et al.",
      year: "2013",
      abstract: "A landmark paper demonstrating deep reinforcement learning on Atari games.",
      link: "https://arxiv.org/abs/1312.5602",
      icon: <FileText className="h-5 w-5" />,
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

      <h1 className="text-3xl font-bold mb-4">Key AI Research Papers</h1>
      <p className="text-muted-foreground mb-8">
        Explore foundational and influential research papers in Artificial Intelligence.
      </p>

      <div className="grid grid-cols-1 gap-6">
        {researchPapers.map((paper) => (
          <a
            key={paper.link}
            href={paper.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1"
          >
            <div className="mr-4 text-primary">{paper.icon}</div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">{paper.title}</h2>
              <p className="text-sm text-muted-foreground mb-1">{paper.authors} ({paper.year})</p>
              <p className="text-sm text-muted-foreground">{paper.abstract}</p>
              <span className="text-xs text-primary mt-2 inline-block">Read Paper</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
} 