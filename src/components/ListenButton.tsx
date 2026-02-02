"use client";

import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

export function ListenButton({ text }: { text: string }) {
  const { speak, stop, isSpeaking, isSupported } = useSpeechSynthesis();

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        isSpeaking ? stop() : speak(text);
      }}
      className="mt-2 inline-flex items-center gap-2 text-sm px-3 py-1 rounded-md border hover:bg-gray-100 dark:hover:bg-white/10"
      aria-label={isSpeaking ? "Stop audio" : "Listen to summary"}
    >
      {isSpeaking ? "⏹ Stop" : "▶️ Listen"}
    </button>
  );
}

