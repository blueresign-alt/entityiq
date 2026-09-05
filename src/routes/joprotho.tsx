import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Shell } from "@/components/brand/shell";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/entityiq/store";

export const Route = createFileRoute("/joprotho")({ component: Joprotho });

const OFFER = [
  "Google Maps / Business Profile optimisation",
  "Review system setup",
  "Website & entity markup",
  "Content & authority",
  "Weekly tracking after the work is live",
];

function Joprotho() {
  const { report } = useApp();
  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">Let Joprotho help</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">We implement what EntityIQ found</h1>
        <p className="mt-2 text-muted-foreground">
          {report
            ? `For ${report.entity.name}, the first sprint would start with: ${report.opportunities[0]?.title ?? "the top visibility gaps"}.`
            : "Run a snapshot first — then this page becomes a scoped proposal, not a brochure."}
        </p>
        <ul className="mt-8 space-y-2">
          {OFFER.map((o) => (
            <li key={o} className="flex gap-2 rounded-xl bg-card px-4 py-3 text-sm elev">
              <Check className="mt-0.5 size-4 text-success" />
              {o}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          Pricing is scoped after the snapshot. No obligation. Cancel anytime on tracking.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <a href="mailto:hello@joprotho.com?subject=EntityIQ%20implementation">Request a scoped proposal</a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/next">Back to options</Link>
          </Button>
        </div>
      </div>
    </Shell>
  );
}
