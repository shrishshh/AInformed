import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/NewComponents/dialog.jsx';
import { Loader2, BookOpen, Lightbulb } from 'lucide-react';
import { useWordDefinition } from '@/hooks/useWordDefinition';

const WordExplanation = ({ word, isOpen, onClose, context }) => {
  const selectedWord =
    typeof word === 'string' ? word : word?.word ?? '';

  const { data: explanation, loading } = useWordDefinition(
    isOpen ? (selectedWord || word) : null,
    context ?? ''
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize text-2xl">
            {selectedWord}
          </DialogTitle>
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
            {explanation.examples?.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">
                  Examples
                </div>
                <ul className="space-y-2 pl-6 text-sm text-gray-700 list-disc">
                  {explanation.examples.map((ex, i) => (
                    <li key={i}>{ex}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default WordExplanation;
