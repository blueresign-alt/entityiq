import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, LineChart as LineIcon, RefreshCw, Star } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Shell } from "@/components/brand/shell";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/entityiq/store";

export const Route = createFileRoute("/tracking")({ component: Tracking });

function Tracking() {
  const { report } = useApp();
  const base = report?.overall ?? 60;
  const data = [
    { w: "W1", score: base },
    { w: "W2", score: Math.min(100, base + 2) },
    { w: "W3", score: Math.min(100, base + 3) },
    { w: "W4", score: Math.min(100, base + 5) },
    { w: "W5", score: Math.min(100, base + 6) },
    { w: "W6", score: Math.min(100, base + 8) },
  ];

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">Continuous tracking</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Stay visible. Stay ahead.</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Your first snapshot is the baseline. Tracking watches whether the entity is improving or quietly decaying.
        </p>
        <div className="mt-8 rounded-xl bg-card p-5 elev">
          <p className="text-sm text-muted-foreground">Projected progress if top actions ship</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="w" tick={{ fill: "currentColor", fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "currentColor", fontSize: 12 }} width={32} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            { icon: RefreshCw, t: "Weekly updates" },
            { icon: LineIcon, t: "Ranking tracking" },
            { icon: Star, t: "Review monitoring" },
            { icon: Bell, t: "Issue alerts" },
          ].map((x) => (
            <li key={x.t} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 elev">
              <x.icon className="size-4 text-primary" />
              {x.t}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/scan">Re-scan my business</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/report">Back to snapshot</Link>
          </Button>
        </div>
      </div>
    </Shell>
  );
}
