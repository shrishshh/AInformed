"use client";
import { format } from "date-fns";

export default function TimeAgo({ date }: { date: string | Date }) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return (
    <span suppressHydrationWarning>
      {format(dateObj, "hh:mm a")}
    </span>
  );
} 