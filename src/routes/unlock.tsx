import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { Shell } from "@/components/brand/shell";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/entityiq/store";

export const Route = createFileRoute("/unlock")({ component: Unlock });

const INCLUDES = [
  "Full signal analysis with evidence hashes",
  "Competitor deep dive",
  "Content & keyword opportunities",
  "Review intelligence",
  "Technical & website audit",
  "Authority & entity analysis",
  "Priority roadmap",
  "Commercial opportunity model",
  "Weekly tracking & alerts",
];

function Unlock() {
  const { report, unlock } = useApp();
  return (
    <Shell>
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-xl bg-card p-6 text-center elev sm:p-8">
          <Lock className="mx-auto size-8 text-primary" />
          <h1 className="mt-4 font-display text-3xl font-semibold">Unlock your complete EntityIQ report</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Get full intelligence, detailed analysis, competitor insights, and a priority roadmap.
          </p>
          <ul className="mt-6 space-y-2 text-left text-sm">
            {INCLUDES.map((x) => (
              <li key={x} className="flex gap-2">
                <Check className="mt-0.5 size-4 text-success" />
                {x}
              </li>
            ))}
          </ul>
          {report?.unlocked ? (
            <Button asChild className="mt-8 w-full" size="lg">
              <Link to="/report">Open the full snapshot</Link>
            </Button>
          ) : (
            <Button
              className="mt-8 w-full"
              size="lg"
              onClick={() => {
                unlock();
              }}
            >
              Unlock full report · from R299
            </Button>
          )}
          <p className="mt-3 text-xs text-fg-subtle">
            Payments are not wired in this version. Unlocking here reveals the evidence ledger and locked recommendations so you can judge the product.
          </p>
        </div>
      </div>
    </Shell>
  );
}
