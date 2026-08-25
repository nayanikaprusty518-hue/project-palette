import { cn } from "@/lib/utils";
import { matchTone } from "@/lib/match";

const toneClass = {
  high: "text-success border-success/40 bg-success/10",
  mid: "text-warning border-warning/40 bg-warning/10",
  low: "text-muted-foreground border-border bg-secondary/50",
} as const;

export function MatchScore({
  score,
  label = "match",
  className,
}: {
  score: number;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums",
        toneClass[matchTone(score)],
        className,
      )}
      title="How well your skills match the required skills"
    >
      {score}% {label}
    </span>
  );
}

export function MatchBar({ score }: { score: number }) {
  const tone = matchTone(score);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          tone === "high" ? "bg-success" : tone === "mid" ? "bg-warning" : "bg-primary/60",
        )}
        style={{ width: `${Math.max(score, 3)}%` }}
      />
    </div>
  );
}
