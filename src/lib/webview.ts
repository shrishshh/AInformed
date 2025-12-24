// WebView detection utility
// Detects if the app is running in the Android WebView with custom User-Agent
export const isWebView =
  typeof navigator !== "undefined" &&
  navigator.userAgent.includes("AInformedApp");

