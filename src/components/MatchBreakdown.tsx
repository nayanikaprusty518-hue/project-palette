import { useRef, useState } from "react";
import { Clock, Layers, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type MatchBreakdown,
  type DomainAlignment,
  matchTone,
} from "@/lib/match";
import { MatchScore } from "@/components/MatchScore";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const domainBadge: Record<
  DomainAlignment,
  { label: string; className: string }
> = {
  strong: {
    label: "Strong alignment",
    className: "border-success/40 bg-success/10 text-success",
  },
  partial: {
    label: "Partial alignment",
    className: "border-warning/40 bg-warning/10 text-warning",
  },
  low: {
    label: "Low alignment",
    className: "border-border bg-secondary/50 text-muted-foreground",
  },
};

function BreakdownRow({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  detail?: string;
  tone?: "high" | "mid" | "low";
}) {
  const barTone = tone ?? matchTone(value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="size-3.5 shrink-0" />
          {label}
        </span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            barTone === "high" ? "bg-success" : barTone === "mid" ? "bg-warning" : "bg-primary/60",
          )}
          style={{ width: `${Math.max(value, 4)}%` }}
        />
      </div>
      {detail && <p className="text-[11px] leading-snug text-muted-foreground">{detail}</p>}
    </div>
  );
}

function BreakdownPanel({ breakdown }: { breakdown: MatchBreakdown }) {
  const domain = domainBadge[breakdown.domainLabel];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold">Match breakdown</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Weighted score from skills, availability, and domain fit.
        </p>
      </div>

      <BreakdownRow
        icon={Layers}
        label="Skills match"
        value={breakdown.skillsMatch}
        detail={
          breakdown.matchedSkills.length > 0
            ? `${breakdown.matchedSkills.length} of ${breakdown.matchedSkills.length + breakdown.missingSkills.length} required skills covered`
            : "Add skills to your profile to improve this score"
        }
      />

      <BreakdownRow
        icon={Clock}
        label="Availability fit"
        value={breakdown.availabilityFit}
        detail={`You: ${breakdown.userHours}h/wk · Project needs ~${breakdown.requiredHours}h/wk`}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Sparkles className="size-3.5 shrink-0" />
            Domain alignment
          </span>
          <span className="font-semibold tabular-nums">{breakdown.domainAlignment}%</span>
        </div>
        <Badge variant="outline" className={cn("text-[10px] font-medium", domain.className)}>
          {domain.label}
        </Badge>
      </div>

      {breakdown.missingSkills.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">Skills to grow</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {breakdown.missingSkills.slice(0, 5).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-[10px]">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MatchBreakdownBadge({
  breakdown,
  label = "match",
  className,
  align = "end",
}: {
  breakdown: MatchBreakdown;
  label?: string;
  className?: string;
  align?: "start" | "center" | "end";
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("cursor-help rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
          onMouseEnter={() => {
            clearCloseTimer();
            setOpen(true);
          }}
          onMouseLeave={scheduleClose}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            clearCloseTimer();
            setOpen((prev) => !prev);
          }}
        >
          <MatchScore score={breakdown.overall} label={label} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 border-border bg-popover p-4 shadow-md"
        align={align}
        side="bottom"
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
        onClick={(e) => e.stopPropagation()}
      >
        <BreakdownPanel breakdown={breakdown} />
      </PopoverContent>
    </Popover>
  );
}

export { BreakdownPanel };
