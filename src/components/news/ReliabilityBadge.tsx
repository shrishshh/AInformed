
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
    colorClass = "bg-[hsl(var(--status-high))] text-[hsl(var(--status-high-foreground))] hover:bg-[hsl(var(--status-high))]_/_90";
    text = "High Reliability";
    IconComponent = ShieldCheck;
  } else if (score >= 0.5) {
    colorClass = "bg-[hsl(var(--status-medium))] text-[hsl(var(--status-medium-foreground))] hover:bg-[hsl(var(--status-medium))]_/_90";
    text = "Medium Reliability";
    IconComponent = ShieldAlert;
  } else {
    colorClass = "bg-[hsl(var(--status-low))] text-[hsl(var(--status-low-foreground))] hover:bg-[hsl(var(--status-low))]_/_90";
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
