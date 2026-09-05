import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, Goal, MapPin, Sparkles, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Shell } from "@/components/brand/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/entityiq/store";
import type { Entity } from "@/lib/entityiq/types";

export const Route = createFileRoute("/confirm")({ component: Confirm });

function Confirm() {
  const nav = useNavigate();
  const { extract, entity, setEntity } = useApp();
  const [draft, setDraft] = useState<Entity | undefined>(entity);

  useEffect(() => {
    if (entity) setDraft(entity);
  }, [entity]);

  if (!draft) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-semibold">Start with your business</h1>
          <p className="mt-2 text-muted-foreground">We need a short description before we can identify anything.</p>
          <Button asChild className="mt-6">
            <Link to="/analyze">Tell us about your business</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  function field(key: "name" | "location" | "industry" | "goal" | "website", value: string) {
    setDraft({ ...draft!, [key]: value });
  }

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">Step 2 of 6</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">We've identified your business</h1>
        <p className="mt-2 text-muted-foreground">
          {extract?.notes ?? "Check this is right. A small correction now keeps the audit honest."}
        </p>

        <div className="mt-8 space-y-3">
          <Row icon={Building2} label="Business name">
            <Input value={draft.name} onChange={(e) => field("name", e.target.value)} />
          </Row>
          <Row icon={MapPin} label="Location">
            <Input value={draft.location} onChange={(e) => field("location", e.target.value)} />
          </Row>
          <Row icon={Sparkles} label="Industry">
            <Input value={draft.industry} onChange={(e) => field("industry", e.target.value)} />
          </Row>
          <Row icon={Wrench} label="Primary services">
            <Input
              value={draft.services.join(", ")}
              onChange={(e) => setDraft({ ...draft, services: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            />
          </Row>
          <Row icon={Goal} label="Goal">
            <Input value={draft.goal} onChange={(e) => field("goal", e.target.value)} />
          </Row>
          <Row icon={Building2} label="Website (optional)">
            <Input
              value={draft.website ?? ""}
              placeholder="https://"
              onChange={(e) => field("website", e.target.value)}
            />
          </Row>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            size="lg"
            onClick={() => {
              setEntity(draft);
              void nav({ to: "/scan" });
            }}
          >
            That's us — scan signals
            <ArrowRight />
          </Button>
          <Badge tone="ok">Match ready</Badge>
        </div>
      </div>
    </Shell>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Building2;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-card p-4 elev">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="size-3.5 text-primary" />
        {label}
      </div>
      {children}
    </div>
  );
}
