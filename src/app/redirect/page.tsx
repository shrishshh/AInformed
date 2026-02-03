"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Legacy OAuth redirect page. With Clerk, OAuth is handled by Clerk.
 * Redirect to home (or sign-in if you want unauthenticated users to land there).
 */
export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}
