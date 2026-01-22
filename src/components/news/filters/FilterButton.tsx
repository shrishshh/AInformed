"use client";

import { cn } from "@/lib/utils";

export function FilterButton({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "transition-colors select-none rounded-xl px-4 py-2 text-sm border",
        active ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted/30 hover:bg-muted border-border",
        className,
      )}
    >
      {children}
    </button>
  );
}

