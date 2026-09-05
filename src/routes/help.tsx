import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/brand/shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/help")({ component: Help });

const PARTNERS = [
  { name: "Local SEO specialist", fit: "Map Pack, categories, service area, citations" },
  { name: "Reputation manager", fit: "Review velocity systems and response playbooks" },
  { name: "Website / technical partner", fit: "Entity markup, service pages, mobile speed" },
];

function Help() {
  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">Get help</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Trusted specialists — not a marketplace dump</h1>
        <p className="mt-2 text-muted-foreground">
          EntityIQ stays the intelligence layer. You keep the relationship with whoever implements.
        </p>
        <ul className="mt-8 space-y-3">
          {PARTNERS.map((p) => (
            <li key={p.name} className="rounded-xl bg-card p-5 elev">
              <h2 className="font-display text-lg font-semibold">{p.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.fit}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          Partner matching with live quotes lands in a later version. For now these are the roles your snapshot typically needs.
        </p>
        <Button asChild className="mt-8">
          <Link to="/next">Back to options</Link>
        </Button>
      </div>
    </Shell>
  );
}
