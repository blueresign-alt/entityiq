import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Shell } from "@/components/brand/shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { extractBusiness } from "@/lib/entityiq/actions";
import { useApp } from "@/lib/entityiq/store";

type Search = { q?: string };

export const Route = createFileRoute("/analyze")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: Analyze,
});

function Analyze() {
  const { q } = Route.useSearch();
  const nav = useNavigate();
  const { prompt, setPrompt, setExtract } = useApp();
  const [local, setLocal] = useState(q || prompt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (q && q !== prompt) setPrompt(q);
  }, [q, prompt, setPrompt]);

  async function submit() {
    const text = local.trim();
    if (text.length < 3) {
      setError("A name, a city, or a sentence is enough — just give us something to go on.");
      return;
    }
    setBusy(true);
    setError(null);
    setPrompt(text);
    try {
      const result = await extractBusiness({ data: { prompt: text } });
      setExtract(result);
      await nav({ to: "/confirm" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that. Try a shorter description.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">Step 1 of 6</p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Tell us about your business</h1>
        <p className="mt-2 text-muted-foreground">Natural language. Super simple. We extract the rest.</p>

        <div className="mt-8 rounded-xl bg-card p-5 elev sm:p-6">
          <Textarea
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder="Joe's Plumbing, Cape Town — emergency and residential call-outs."
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
            }}
          />
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <Button size="lg" className="mt-4 w-full sm:w-auto" disabled={busy} onClick={() => void submit()}>
            {busy ? (
              <>
                <Loader2 className="animate-spin" /> Identifying…
              </>
            ) : (
              <>
                Analyse my business
                <ArrowRight />
              </>
            )}
          </Button>
        </div>
      </div>
    </Shell>
  );
}
