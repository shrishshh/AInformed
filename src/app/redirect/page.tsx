"use client";
import { useEffect } from "react";
import { useAuthStatus } from "@/hooks/useAuthStatus";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function GoogleAuthRedirectPage() {
  const { login } = useAuthStatus();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const token = url.searchParams.get("token");
      console.log("Token received:", token ? "Yes" : "No");
      
      if (token) {
        localStorage.setItem("token", token);
        console.log("Token saved to localStorage");
        login();
        console.log("Login function called");
        window.location.replace("/"); // Force full reload
      } else {
        console.log("No token found, redirecting to auth page");
        window.location.replace("/auth");
      }
    }
  }, [login]);

  return null; // No UI needed
} 