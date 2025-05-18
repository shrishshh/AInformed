
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

interface ReliabilityBadgeProps {
  score: number;
}

export function ReliabilityBadge({ score }: ReliabilityBadgeProps) {
  let colorClass = "";
  let text = "";
  let IconComponent = ShieldAlert;

  if (score >= 0.8) {
    colorClass = "bg-accent text-accent-foreground hover:bg-accent/90"; // Muted Green
    text = "High Reliability";
    IconComponent = ShieldCheck;
  } else if (score >= 0.5) {
    colorClass = "bg-yellow-400 text-yellow-900 hover:bg-yellow-400/90"; // Yellow - using direct Tailwind color
    text = "Medium Reliability";
    IconComponent = ShieldAlert;
  } else {
    colorClass = "bg-red-500 text-white hover:bg-red-500/90"; // Red - using direct Tailwind color
    text = "Low Reliability";
    IconComponent = ShieldX;
  }

  return (
    <Badge variant="outline" className={`border-transparent ${colorClass} transition-colors`}>
      <IconComponent className="h-3.5 w-3.5 mr-1.5" />
      {text} ({score.toFixed(2)})
    </Badge>
  );
}
