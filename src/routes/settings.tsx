import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/brand/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getKeyStatus, saveKeys } from "@/lib/entityiq/actions";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof getKeyStatus>> | null>(null);
  const [places, setPlaces] = useState("");
  const [pagespeed, setPagespeed] = useState("");
  const [cseKey, setCseKey] = useState("");
  const [cseCx, setCseCx] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getKeyStatus().then(setStatus);
  }, []);

  async function onSave() {
    setBusy(true);
    const next = await saveKeys({
      data: {
        googlePlaces: places || undefined,
        googlePageSpeed: pagespeed || undefined,
        googleCseKey: cseKey || undefined,
        googleCseCx: cseCx || undefined,
      },
    });
    setStatus(next);
    setPlaces("");
    setPagespeed("");
    setCseKey("");
    setCseCx("");
    setSaved(true);
    setBusy(false);
  }

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-semibold">Integrations</h1>
        <p className="mt-2 text-muted-foreground">
          EntityIQ is public-data first. It already runs on OpenStreetMap, a website crawl, Wikipedia, and Grok. Keys you paste here stay on the server for this session and are never shown in the browser after save.
        </p>

        <section className="mt-8 rounded-xl bg-card p-5 elev">
          <h2 className="font-display text-lg font-semibold">Already running</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <Row ok={Boolean(status?.grok)} name="xAI Grok" detail="Extraction + plain-English briefing. Platform key — you do not paste this." />
            <Row ok name="Website crawler" detail="HTTPS, title, schema, social, robots, sitemap, content depth." />
            <Row ok name="OpenStreetMap Nominatim" detail="Geocoding and venue corroboration." />
            <Row ok name="Wikipedia API" detail="Knowledge-graph style entity check." />
          </ul>
        </section>

        <section className="mt-4 rounded-xl bg-card p-5 elev">
          <h2 className="font-display text-lg font-semibold">Give us these for live depth</h2>
          <p className="mt-1 text-sm text-muted-foreground">Same Google Cloud project can power all three. Restrict keys to these APIs only.</p>

          <Field
            label="Google Places API key"
            hint="Places API (New) or legacy Places. One text-search call per audit. Unlocks live rating, review volume, and listing match."
            connected={Boolean(status?.places)}
            masked={status?.placesMasked}
            value={places}
            onChange={setPlaces}
          />
          <Field
            label="PageSpeed Insights API key"
            hint="One mobile lab run per audit. Unlocks a live performance score instead of an estimate."
            connected={Boolean(status?.pagespeed)}
            masked={status?.pagespeedMasked}
            value={pagespeed}
            onChange={setPagespeed}
          />
          <Field
            label="Google Custom Search API key"
            hint="JSON API key."
            connected={Boolean(status?.cse)}
            masked={status?.cseKeyMasked}
            value={cseKey}
            onChange={setCseKey}
          />
          <Field
            label="Custom Search Engine ID (cx)"
            hint="The search engine that samples the open web. Together with the key this samples whether your name and domain appear."
            connected={Boolean(status?.cse)}
            masked={status?.cseCxMasked}
            value={cseCx}
            onChange={setCseCx}
          />

          <Button className="mt-4" disabled={busy} onClick={() => void onSave()}>
            {busy ? "Saving…" : "Save keys"}
          </Button>
          {saved && <p className="mt-2 text-sm text-success">Stored for this server session. Re-run an audit to use them.</p>}
        </section>

        <section className="mt-4 rounded-xl bg-card p-5 elev">
          <h2 className="font-display text-lg font-semibold">Later — not required for v1</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Google Search Console OAuth — first-party queries, after the public snapshot exists.</li>
            <li>DataForSEO or SerpAPI — true Map Pack positions at scale.</li>
            <li>Higgsfield — 60-second video briefing from the script we already write.</li>
            <li>Outscraper / BrightLocal — deeper citation and review graphs.</li>
            <li>Companies and Intellectual Property Commission (CIPC) — SA legal-entity match.</li>
          </ul>
        </section>
      </div>
    </Shell>
  );
}

function Row({ ok, name, detail }: { ok: boolean; name: string; detail: string }) {
  return (
    <li className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
      <span className="font-medium">
        {name} <Badge tone={ok ? "ok" : "warn"}>{ok ? "connected" : "waiting"}</Badge>
      </span>
      <span className="text-muted-foreground">{detail}</span>
    </li>
  );
}

function Field({
  label,
  hint,
  connected,
  masked,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  connected?: boolean;
  masked?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="mt-5 block">
      <span className="flex items-center justify-between gap-2 text-sm font-medium">
        {label}
        <Badge tone={connected ? "ok" : "muted"}>{connected ? `On · ${masked}` : "Not connected"}</Badge>
      </span>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <Input className="mt-2" type="password" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste key" />
    </label>
  );
}
