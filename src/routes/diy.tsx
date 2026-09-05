import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { Shell } from "@/components/brand/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/entityiq/store";

export const Route = createFileRoute("/diy")({ component: Diy });

function Diy() {
  const { report } = useApp();
  const items = report?.recommendations ?? [];

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">Do it yourself</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">A plan you can execute this week</h1>
        <p className="mt-2 text-muted-foreground">
          Each action comes from a finding in your snapshot — not a generic SEO checklist.
        </p>
        <ol className="mt-8 space-y-4">
          {(items.length ? items : []).map((r, i) => (
            <li key={r.id} className="rounded-xl bg-card p-5 elev">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-sm text-primary">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="font-medium">{r.title}</h2>
                <Badge>{r.effort} effort</Badge>
                <Badge tone="warn">{r.impact} impact</Badge>
                {r.locked && !report?.unlocked && <Lock className="size-3.5 text-muted-foreground" />}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.why}</p>
              {(!r.locked || report?.unlocked) && (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {r.steps.map((s) => (
                    <li key={s} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
        {!items.length && (
          <p className="mt-6 text-muted-foreground">Run an audit first and we will attach a plan to the findings.</p>
        )}
        <div className="mt-8 flex gap-3">
          <Button asChild>
            <Link to="/next">Back to options</Link>
          </Button>
          {!report?.unlocked && (
            <Button asChild variant="outline">
              <Link to="/unlock">Unlock remaining steps</Link>
            </Button>
          )}
        </div>
      </div>
    </Shell>
  );
}
