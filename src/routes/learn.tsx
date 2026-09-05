import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/brand/shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/learn")({ component: Learn });

const ITEMS = [
  { t: "AI & automation fundamentals", d: "How assistants decide which businesses to mention." },
  { t: "Digital marketing strategy", d: "Demand capture versus demand creation for local services." },
  { t: "Entity & brand building", d: "Name–address–phone consistency as a system, not a task." },
  { t: "Local SEO basics", d: "Map Pack mechanics in plain English." },
];

function Learn() {
  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">Learn first</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Understand the options before you execute</h1>
        <p className="mt-2 text-muted-foreground">Short paths. No jargon for its own sake.</p>
        <ul className="mt-8 space-y-3">
          {ITEMS.map((i) => (
            <li key={i.t} className="rounded-xl bg-card p-5 elev">
              <h2 className="font-display text-lg font-semibold">{i.t}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{i.d}</p>
            </li>
          ))}
        </ul>
        <Button asChild className="mt-8">
          <Link to="/next">Back to options</Link>
        </Button>
      </div>
    </Shell>
  );
}
