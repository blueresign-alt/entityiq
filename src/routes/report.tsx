import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lock, MapPin, Phone, TrendingUp, Play } from "lucide-react";
import { Shell } from "@/components/brand/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/brand/score-ring";
import { useApp } from "@/lib/entityiq/store";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

export const Route = createFileRoute("/report")({ component: Report });

function Report() {
  const { report } = useApp();

  if (!report) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-2xl">No snapshot yet</h1>
          <Button asChild className="mt-6">
            <Link to="/analyze">Run an audit</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const zar = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
  const recs = report.unlocked ? report.recommendations : report.recommendations.filter((r) => !r.locked).slice(0, 3);

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">Your EntityIQ snapshot</p>
            <h1 className="mt-1 font-display text-3xl font-semibold">{report.entity.name}</h1>
            <p className="text-sm text-muted-foreground">
              {report.entity.location} · Generated {new Date(report.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {report.liveProvidersUsed.map((p) => (
              <Badge key={p} tone="ok">
                {p}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-12">
          <section className="rounded-xl bg-card p-5 elev lg:col-span-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Current visibility</p>
            <div className="mt-4 flex items-center gap-4">
              <ScoreRing score={report.overall} size={128} label={report.band} />
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3.5" /> Map Pack
                  </div>
                  <p className="font-display text-xl font-semibold tabular-nums">
                    {report.mapPackEstimate?.position ? `#${report.mapPackEstimate.position}` : "—"}
                  </p>
                  <p className="text-xs text-fg-subtle">{report.mapPackEstimate?.keyword}</p>
                </div>
                <p className="text-xs text-muted-foreground">{report.mapPackEstimate?.note}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {report.pillars.map((p) => (
                <div key={p.pillar} className="rounded-lg bg-surface-2 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{p.label}</div>
                  <div className="font-display text-lg tabular-nums">
                    {p.score}
                    <span className="text-xs text-fg-subtle">/100</span>
                  </div>
                </div>
              ))}
            </div>
            {report.review && (
              <p className="mt-4 text-sm text-muted-foreground">
                {report.review.rating}★ · {report.review.count} reviews ({report.review.source})
              </p>
            )}
          </section>

          <section className="rounded-xl bg-card p-5 elev lg:col-span-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Your 3 biggest opportunities</p>
            <ol className="mt-4 space-y-4">
              {report.opportunities.map((o, i) => (
                <li key={o.id} className="flex gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-2 font-display text-sm">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{o.title}</p>
                      <Badge tone={o.severity === "critical" || o.severity === "high" ? "warn" : "muted"}>
                        {o.severity} impact
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{o.plainEnglish}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-xl bg-card p-5 elev lg:col-span-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Potential business impact</p>
            <div className="mt-4 space-y-4">
              <Impact icon={Phone} label="More enquiries / month" value={`+${report.opportunity.extraEnquiriesMonth[0]} – ${report.opportunity.extraEnquiriesMonth[1]}`} />
              <Impact icon={TrendingUp} label="Avg job value" value={`${zar.format(report.opportunity.avgJobValueZar[0])} – ${zar.format(report.opportunity.avgJobValueZar[1])}`} />
              <Impact
                icon={TrendingUp}
                label="Potential additional revenue / month"
                value={`${zar.format(report.opportunity.extraRevenueMonthZar[0])} – ${zar.format(report.opportunity.extraRevenueMonthZar[1])}`}
              />
            </div>
            <p className="mt-4 text-xs text-fg-subtle">{report.opportunity.assumptions[0]}</p>
          </section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <section className="rounded-xl bg-card p-5 elev lg:col-span-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Top immediate actions</p>
            <ol className="mt-4 space-y-3">
              {recs.map((r, i) => (
                <li key={r.id} className="flex gap-3 text-sm">
                  <span className="font-display text-primary">{i + 1}</span>
                  <div>
                    <p className="font-medium">
                      {r.title} {r.locked && !report.unlocked ? <Lock className="ml-1 inline size-3.5" /> : null}
                    </p>
                    <p className="text-muted-foreground">{r.why}</p>
                  </div>
                </li>
              ))}
            </ol>
            {!report.unlocked && (
              <Button asChild variant="outline" className="mt-4">
                <Link to="/unlock">
                  See all recommendations <Lock className="size-3.5" />
                </Link>
              </Button>
            )}
          </section>

          <section className="rounded-xl bg-card p-5 elev lg:col-span-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Comparison snapshot</p>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.comparison} layout="vertical" margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis type="category" dataKey="metric" width={78} tick={{ fill: "currentColor", fontSize: 11 }} interval={0} />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="you" name="You" fill="var(--accent)" radius={2} />
                  <Bar dataKey="average" name="Peer avg" fill="color-mix(in oklab, var(--fg) 28%, transparent)" radius={2} />
                  <Bar dataKey="top" name="Top" fill="color-mix(in oklab, var(--success) 70%, transparent)" radius={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Top competitors: {report.competitors.map((c) => c.name).join(" · ")}</p>
          </section>

          <section className="rounded-xl bg-card p-5 elev lg:col-span-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">60-second briefing</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{report.briefing}</p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-fg-subtle">
              <Play className="size-3.5" /> Video walkthrough comes next (Higgsfield). The script is ready.
            </p>
          </section>
        </div>

        <section className="mt-4 rounded-xl bg-card p-5 elev">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Signals this run</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {report.signals.map((s) => (
              <li key={s.id} className="rounded-lg bg-surface-2 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{s.label}</span>
                  <Badge tone={s.status === "live" ? "ok" : s.status === "missing" ? "danger" : "warn"}>{s.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
              </li>
            ))}
          </ul>
          {report.unlocked && (
            <div className="mt-6">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Evidence ledger</p>
              <ul className="mt-3 max-h-64 space-y-2 overflow-auto text-xs">
                {report.evidence.map((e) => (
                  <li key={e.id} className="rounded-md bg-surface-2 px-3 py-2">
                    <span className="text-muted-foreground">{e.source}</span>
                    <span className="mx-2 text-fg-subtle">·</span>
                    <span className="font-medium">{e.label}</span>
                    <span className="mx-2 text-fg-subtle">·</span>
                    <span>{e.value}</span>
                    <span className="ml-2 font-mono text-fg-subtle">{e.hash}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/next">
              What should I do next <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/unlock">Unlock the complete report</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link to="/tracking">Start tracking</Link>
          </Button>
        </div>
      </div>
    </Shell>
  );
}

function Impact({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 items-center justify-center rounded-md bg-surface-2 text-primary">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="font-display text-lg font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
