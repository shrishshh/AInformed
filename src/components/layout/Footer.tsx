
"use client";

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-6 mt-auto border-t border-border bg-card">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        &copy; {currentYear} AInformed &bull; Powered by Genkit AI
      </div>
    </footer>
  );
}
