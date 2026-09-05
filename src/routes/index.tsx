import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Brain, Eye, FileSearch, Shield, Target, Lock } from "lucide-react";
import { Shell } from "@/components/brand/shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/lib/entityiq/store";
import { useState } from "react";

export const Route = createFileRoute("/")({ component: Home });

const STATS = [
  { n: "12,847+", l: "Businesses analysed" },
  { n: "1.6M+", l: "Data points scanned" },
  { n: "2.4M+", l: "Reviews analysed" },
  { n: "38", l: "Industries covered" },
];

const PILLARS = [
  { icon: Eye, t: "Search visibility" },
  { icon: Shield, t: "Reputation" },
  { icon: FileSearch, t: "Content strength" },
  { icon: Brain, t: "AI visibility" },
  { icon: Target, t: "Competitive intelligence" },
];

function Home() {
  const nav = useNavigate();
  const { prompt, setPrompt } = useApp();
  const [local, setLocal] = useState(prompt);

  function go(text?: string) {
    const next = (text ?? local).trim();
    setPrompt(next);
    void nav({ to: "/analyze", search: { q: next || undefined } });
  }

  return (
    <Shell>
      <section className="relative overflow-hidden">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-16 text-center sm:pt-24">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.28em] text-primary">
            Intelligence beyond the surface
          </p>
          <h1 className="font-display text-4xl font-semibold sm:text-6xl">
            Understand your digital entity.
            <span className="block text-primary">Unlock your potential.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            One sentence about your business. Public signals. A score you can defend. Plain-English advice on what to do next.
          </p>
          <blockquote className="mx-auto mt-8 max-w-lg text-sm text-muted-foreground">
            “In the digital age, your reputation is your most valuable currency.”
            <footer className="mt-2 text-xs uppercase tracking-[0.16em] text-fg-subtle">Jay Baer · Digital strategist</footer>
          </blockquote>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="rounded-xl bg-card p-5 elev sm:p-7">
          <label htmlFor="biz" className="text-sm font-medium">
            Tell us about your business
          </label>
          <p className="mt-1 text-sm text-muted-foreground">Natural language. Name, place, what you do — that is enough.</p>
          <Textarea
            id="biz"
            className="mt-4 min-h-28"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder="I run a plumbing company in Cape Town. We do residential plumbing and emergency call-outs. We want more customers from Google."
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => go()}>
              Let's run your EntityIQ audit
              <ArrowRight />
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              onClick={() => {
                const sample =
                  "I run a plumbing company in Cape Town. We do residential plumbing and emergency call-outs. We want more customers from Google.";
                setLocal(sample);
                go(sample);
              }}
            >
              Try the Cape Town plumber example
            </button>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.l} className="rounded-lg bg-card px-4 py-5 text-center elev">
              <div className="font-display text-xl font-semibold tabular-nums sm:text-2xl">{s.n}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl bg-card p-5 elev sm:p-6">
          <p className="text-sm text-muted-foreground">
            EntityIQ scans public digital signals across search, reviews, social, content, and AI platforms to reveal the true picture of your business online.
          </p>
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-5">
            {PILLARS.map(({ icon: Icon, t }) => (
              <li key={t} className="flex items-center gap-2 text-sm sm:flex-col sm:text-center">
                <span className="flex size-9 items-center justify-center rounded-md bg-surface-2 text-primary">
                  <Icon className="size-4" />
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="size-3.5" />
          Public-data first. Google Search Console is optional later — not required to start.
        </p>
      </section>
    </Shell>
  );
}
