"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-12">
      <h1 className="text-2xl font-bold">Sign In / Sign Up</h1>
      <p className="text-muted-foreground text-center max-w-sm">
        Access the latest AI news and insights with your account.
      </p>
      <div className="flex gap-4">
        <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600">
          <Link href="/auth/login">Sign In</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auth/signup">Sign Up</Link>
        </Button>
      </div>
    </div>
  );
}
