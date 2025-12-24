"use client";

import { useEffect } from "react";
import { isWebView } from "@/lib/webview";

/**
 * WebViewDetector component
 * Adds 'webview' class to body when running in Android WebView
 * This allows us to apply WebView-specific CSS fixes without affecting the web version
 */
export function WebViewDetector() {
  useEffect(() => {
    if (isWebView) {
      document.body.classList.add("webview");
    }
  }, []);

  return null; // This component doesn't render anything
}

