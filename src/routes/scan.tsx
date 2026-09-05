import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { Shell } from "@/components/brand/shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/brand/score-ring";
import { assessBusiness } from "@/lib/entityiq/actions";
import { useApp } from "@/lib/entityiq/store";
import type { Entity } from "@/lib/entityiq/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scan")({ component: Scan });

const STEPS = [
  { id: "gbp", label: "Google Business Profile" },
  { id: "web", label: "Website & technical" },
  { id: "local", label: "Local search rankings" },
  { id: "reviews", label: "Reviews & reputation" },
  { id: "comp", label: "Competitors" },
  { id: "cite", label: "Citations & authority" },
  { id: "social", label: "Social & entity signals" },
];

const assessInflight = new Map<string, Promise<Awaited<ReturnType<typeof assessBusiness>>>>();

function entityKey(entity: Entity): string {
  return JSON.stringify({
    name: entity.name,
    location: entity.location,
    industry: entity.industry,
    website: entity.website ?? "",
    services: entity.services,
    goal: entity.goal,
  });
}

function assessOnce(entity: Entity) {
  const key = entityKey(entity);
  const existing = assessInflight.get(key);
  if (existing) return existing;
  const pending = assessBusiness({ data: { entity } }).finally(() => {
    window.setTimeout(() => {
      if (assessInflight.get(key) === pending) assessInflight.delete(key);
    }, 2500);
  });
  assessInflight.set(key, pending);
  return pending;
}

function Scan() {
  const nav = useNavigate();
  const { entity, setReport, report } = useApp();
  const [pct, setPct] = useState(6);
  const [doneIdx, setDoneIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"run" | "score" | "findings">("run");

  useEffect(() => {
    if (!entity) return;
    let cancelled = false;
    const tick = window.setInterval(() => {
      setPct((p) => Math.min(90, p + 2));
      setDoneIdx((i) => Math.min(STEPS.length, i + (Math.random() > 0.45 ? 1 : 0)));
    }, 700);

    void (async () => {
      try {
        const result = await assessOnce(entity);
        if (cancelled) return;
        setReport(result);
        setPct(100);
        setDoneIdx(STEPS.length);
        setPhase("score");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Scan failed. Try again.");
      } finally {
        window.clearInterval(tick);
      }
    })();

    return () => {
      cancelled = true;
      window.clearInterval(tick);
    };
  }, [entity, setReport]);

  const liveReport = report && entity && report.entity.name === entity.name ? report : undefined;

  if (!entity) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-2xl">No business loaded</h1>
          <Button asChild className="mt-6">
            <Link to="/analyze">Start an audit</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">Step 3 of 6</p>
            <h1 className="mt-2 font-display text-3xl font-semibold">
              {phase === "run"
                ? "We're scanning 50+ digital signals"
                : phase === "score"
                  ? "EntityIQ score"
                  : "Here's what we found"}
            </h1>
          </div>
          <Badge tone="ok">
            <span className="live-dot size-1.5 rounded-full bg-success" /> Live
          </Badge>
        </div>

        <div className="mt-6 rounded-xl bg-card p-5 elev">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-display text-lg font-semibold">{entity.name}</p>
              <p className="text-sm text-muted-foreground">{entity.location}</p>
            </div>
            {liveReport?.review && (
              <p className="text-sm tabular-nums text-muted-foreground">
                {liveReport.review.rating}★ · {liveReport.review.count} reviews
              </p>
            )}
          </div>
        </div>

        {phase === "run" && (
          <div className="mt-6 rounded-xl bg-card p-5 elev">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Scanning public signals</span>
              <span className="tabular-nums text-primary">{pct}%</span>
            </div>
            <Progress value={pct} />
            <ul className="mt-5 space-y-2.5">
              {STEPS.map((s, i) => {
                const done = i < doneIdx;
                const active = i === doneIdx && doneIdx < STEPS.length;
                return (
                  <li key={s.id} className="flex items-center gap-3 text-sm">
                    {done ? (
                      <Check className="size-4 text-success" />
                    ) : active ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <Circle className="size-4 text-fg-subtle" />
                    )}
                    <span className={cn(done ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
                  </li>
                );
              })}
            </ul>
            {error && <p className="mt-4 text-sm text-danger">{error}</p>}
          </div>
        )}

        {phase === "score" && liveReport && (
          <div className="mt-6 rounded-xl bg-card p-6 text-center elev">
            <ScoreRing score={liveReport.overall} label={liveReport.band} />
            <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">{liveReport.summary}</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {liveReport.pillars.map((p) => (
                <div key={p.pillar} className="rounded-lg bg-surface-2 px-3 py-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{p.label}</div>
                  <div className="mt-1 font-display text-xl font-semibold tabular-nums">{p.score}</div>
                </div>
              ))}
            </div>
            <Button className="mt-6" size="lg" onClick={() => setPhase("findings")}>
              Explain what you found
            </Button>
          </div>
        )}

        {phase === "findings" && liveReport && (
          <div className="mt-6 space-y-3">
            {liveReport.opportunities.map((f) => (
              <div key={f.id} className="rounded-xl bg-card p-4 elev">
                <p className="text-[11px] uppercase tracking-[0.14em] text-warn">{f.severity}</p>
                <p className="mt-1 font-medium">{f.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.plainEnglish}</p>
              </div>
            ))}
            <p className="px-1 text-sm text-muted-foreground">
              There are high-impact opportunities that can bring you more customers consistently.
            </p>
            <Button size="lg" className="w-full sm:w-auto" onClick={() => void nav({ to: "/report" })}>
              View my snapshot
            </Button>
          </div>
        )}
      </div>
    </Shell>
  );
}
