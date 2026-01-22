"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilterButton } from "./FilterButton";

export function ExploreSourcesModal({
  open,
  onOpenChange,
  sources,
  selectedSource,
  onSelectSource,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: string[];
  selectedSource: string | null;
  onSelectSource: (source: string | null) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Explore All Sources</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <FilterButton
              active={!selectedSource}
              onClick={() => {
                onSelectSource(null);
                onOpenChange(false);
              }}
            >
              All
            </FilterButton>

            {sources.map((s) => (
              <FilterButton
                key={s}
                active={(selectedSource || "").toLowerCase() === s.toLowerCase()}
                onClick={() => {
                  onSelectSource(s);
                  onOpenChange(false);
                }}
              >
                {s}
              </FilterButton>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

