import { cn } from "@/lib/utils";

export function ScoreRing({
  score,
  size = 168,
  label,
  className,
}: {
  score: number;
  size?: number;
  label?: string;
  className?: string;
}) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.max(0, Math.min(100, score)) / 100) * circ;
  const tone = score >= 72 ? "text-success" : score >= 50 ? "text-warn" : "text-danger";

  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 132 132" className="size-full -rotate-90" aria-hidden>
          <circle cx="66" cy="66" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-2" />
          <circle
            cx="66"
            cy="66"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className={tone}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-display text-4xl font-semibold tabular-nums leading-none", tone)}>{score}</span>
          <span className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">/ 100</span>
        </div>
      </div>
      {label && <span className="mt-2 text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}
