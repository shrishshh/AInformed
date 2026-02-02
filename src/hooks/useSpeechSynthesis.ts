"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeakOptions = {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
};

const EVENT_NAME = "ainformed:speech:activeId";
let idSeq = 0;
let activeId: string | null = null;

function canUseSpeechSynthesis() {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

function setActiveId(next: string | null) {
  activeId = next;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { activeId } }));
}

export function useSpeechSynthesis(defaultOptions: SpeakOptions = {}) {
  const idRef = useRef<string>(`speech-${++idSeq}`);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onActiveIdChange = (event: Event) => {
      const { activeId: nextActiveId } =
        (event as CustomEvent<{ activeId: string | null }>).detail ?? {};
      setIsSpeaking(nextActiveId === idRef.current);
    };

    window.addEventListener(EVENT_NAME, onActiveIdChange as EventListener);
    return () => {
      window.removeEventListener(EVENT_NAME, onActiveIdChange as EventListener);
    };
  }, []);

  const stop = useCallback(() => {
    if (!canUseSpeechSynthesis()) {
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setActiveId(null);
  }, []);

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      if (!text?.trim()) return;
      if (!canUseSpeechSynthesis()) return;

      // Cancel any ongoing speech before starting a new one.
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang ?? defaultOptions.lang ?? "en-US";
      utterance.rate = options.rate ?? defaultOptions.rate ?? 1;
      utterance.pitch = options.pitch ?? defaultOptions.pitch ?? 1;
      utterance.volume = options.volume ?? defaultOptions.volume ?? 1;

      utteranceRef.current = utterance;

      // Sync state across all hook instances (lists of cards).
      setActiveId(idRef.current);
      setIsSpeaking(true);

      utterance.onend = () => {
        utteranceRef.current = null;
        if (activeId === idRef.current) setActiveId(null);
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        utteranceRef.current = null;
        if (activeId === idRef.current) setActiveId(null);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [defaultOptions.lang, defaultOptions.pitch, defaultOptions.rate, defaultOptions.volume],
  );

  useEffect(() => {
    return () => {
      if (!canUseSpeechSynthesis()) return;
      if (activeId === idRef.current) {
        window.speechSynthesis.cancel();
        setActiveId(null);
      }
    };
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported: canUseSpeechSynthesis(),
  };
}

