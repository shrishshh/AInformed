import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/NewComponents/dialog.jsx';
import { mockWordDefinitions } from '@/components/NewComponents/mockNews';
import { Loader2, BookOpen, Lightbulb } from 'lucide-react';


const WordExplanation = ({ word, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState(null);

  useEffect(() => {
    if (word && isOpen) {
      fetchExplanation(word);
    }
  }, [word, isOpen]);

  const fetchExplanation = async (selectedWord) => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Get mock definition or create a default one
    const wordLower = selectedWord.toLowerCase();
    const mockDef = mockWordDefinitions[wordLower];

    if (mockDef) {
      setExplanation(mockDef);
    } else {
      // Generate a generic explanation for unmocked words
      setExplanation({
        word: selectedWord,
        standardDefinition: `A word or phrase used in the context of the article. The exact definition would be provided by an AI-powered dictionary service.`,
        contextualExplanation: `In this article, "${selectedWord}" is used to convey specific meaning relevant to the topic. An AI service would provide detailed contextual analysis here.`,
        examples: [
          `Example usage of "${selectedWord}" in a sentence.`,
          `Another contextual example would appear here.`
        ]
      });
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize text-2xl">{word}</DialogTitle>
          <DialogDescription>
            AI-powered word explanation and definition
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : explanation ? (
          <div className="space-y-6 py-4">
            {/* Standard Definition */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BookOpen className="h-4 w-4" />
                <span>Standard Definition</span>
              </div>
              <p className="text-gray-800 leading-relaxed pl-6">
                {explanation.standardDefinition}
              </p>
            </div>

            {/* Contextual Explanation */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Lightbulb className="h-4 w-4" />
                <span>In Context</span>
              </div>
              <p className="text-gray-800 leading-relaxed pl-6">
                {explanation.contextualExplanation}
              </p>
            </div>

            {/* Examples */}
            {explanation.examples && explanation.examples.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">
                  Examples
                </div>
                <ul className="space-y-2 pl-6">
                  {explanation.examples.map((example, idx) => (
                    <li key={idx} className="text-gray-700 text-sm list-disc">
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mock Notice */}
            <div className="text-xs text-gray-500 italic pt-4 border-t">
              Note: Currently showing mock data. Will be powered by Perplexity AI in production.
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default WordExplanation;