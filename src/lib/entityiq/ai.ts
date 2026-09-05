import type { ExtractResult, SnapshotReport } from "./types";
import { resolvedKeys } from "./keys";

const MODEL = "grok-4.5";

async function grokChat(opts: {
  system: string;
  user: string;
  max_tokens: number;
  json?: boolean;
}): Promise<string | null> {
  const apiKey = resolvedKeys().grok;
  if (!apiKey) return null;
  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: opts.max_tokens,
    temperature: 0.2,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  };
  if (opts.json) {
    body.response_format = { type: "json_object" };
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

function heuristicExtract(prompt: string): ExtractResult {
  const trimmed = prompt.trim();
  const url = trimmed.match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9][-a-z0-9.]*\.(?:co\.za|com|net|org|io)\b/i)?.[0];
  const inLoc = trimmed.match(/\bin\s+([A-Z][A-Za-z ]+(?:,\s*[A-Z][A-Za-z ]+)*)/);
  const location =
    inLoc?.[1]?.trim() ||
    (trimmed.match(/Cape Town|Johannesburg|Pretoria|Durban|Gordon'?s Bay|Western Cape|Gauteng/i)?.[0] ?? "South Africa");
  const industry = /plumb/i.test(trimmed)
    ? "Plumbing Services"
    : /mechanic|auto|car/i.test(trimmed)
      ? "Auto Repair"
      : /dent/i.test(trimmed)
        ? "Dental"
        : "Local services";
  const services: string[] = [];
  if (/emergency/i.test(trimmed)) services.push("Emergency call-outs");
  if (/residential/i.test(trimmed)) services.push("Residential");
  if (/commercial/i.test(trimmed)) services.push("Commercial");
  const quoted = trimmed.match(/["“]([A-Z][^"”]{2,40})["”]/);
  const nameMatch = trimmed.match(/^["']?([A-Z][A-Za-z0-9'&. -]{2,40}?)(?:["']|,|\s+in\s+|\s+—|\s+-)/);
  const looksGeneric = /^(i run|we run|we are|my|our|a |an )/i.test(trimmed);
  const name = quoted?.[1]
    || (!looksGeneric && nameMatch?.[1]?.replace(/\s+(company|business|pty|ltd)$/i, "").trim())
    || `${location.split(",")[0]} ${industry.replace(/services/i, "").trim()}`.trim();
  const goal = /google/i.test(trimmed) ? "Get more customers from Google" : "Grow local demand";
  return {
    entity: {
      name,
      location,
      country: "South Africa",
      industry,
      services: services.length ? services : ["Core services"],
      goal,
      website: url ? (url.startsWith("http") ? url : `https://${url}`) : undefined,
      query: trimmed,
    },
    confidence: 0.55,
    notes: "Extracted on-device from your description.",
    matchLabel: "Best guess from your words",
  };
}

export async function extractEntity(prompt: string): Promise<ExtractResult> {
  const fallback = heuristicExtract(prompt);
  const text = await grokChat({
    json: true,
    max_tokens: 500,
    system:
      "You extract a business entity from a short user description. Return JSON only. Never invent a website. If the user did not give a trading name, set name to a descriptive label like \"Cape Town plumbing business\" using location + trade — do not invent a brand. Prefer South African geography when implied.",
    user: `Extract fields from this business description:\n"""${prompt.slice(0, 1200)}"""\n\nJSON shape: {"name":string,"location":string,"region":string,"country":string,"industry":string,"services":string[],"goal":string,"website":string|null,"phone":string|null,"confidence":number,"notes":string}`,
  });
  if (!text) return fallback;
  try {
    const json = JSON.parse(text) as {
      name?: string;
      location?: string;
      region?: string;
      country?: string;
      industry?: string;
      services?: string[];
      goal?: string;
      website?: string | null;
      phone?: string | null;
      confidence?: number;
      notes?: string;
    };
    if (!json.name) return fallback;
    return {
      entity: {
        name: json.name,
        location: json.location || fallback.entity.location,
        region: json.region,
        country: json.country || "South Africa",
        industry: json.industry || fallback.entity.industry,
        services: json.services?.length ? json.services : fallback.entity.services,
        goal: json.goal || fallback.entity.goal,
        website: json.website || fallback.entity.website,
        phone: json.phone ?? undefined,
        query: prompt.trim(),
      },
      confidence: typeof json.confidence === "number" ? json.confidence : 0.75,
      notes: json.notes || "Extracted from your description.",
      matchLabel: "We identified your business",
    };
  } catch {
    return fallback;
  }
}

export async function writeBriefing(report: Omit<SnapshotReport, "briefing" | "id" | "createdAt" | "unlocked">): Promise<string> {
  const fallback = [
    `${report.entity.name} scored ${report.overall}/100 — ${report.band.toLowerCase()}.`,
    report.summary,
    report.opportunities[0] ? `Biggest gap: ${report.opportunities[0].title.toLowerCase()}. ${report.opportunities[0].plainEnglish}` : "",
    report.opportunities[1] ? `Next: ${report.opportunities[1].plainEnglish}` : "",
    "We recommend acting on the top three opportunities in order — they are the shortest path to more of the customers already looking for you.",
  ]
    .filter(Boolean)
    .join(" ");

  const text = await grokChat({
    max_tokens: 420,
    system:
      "You are EntityIQ, a calm business-intelligence consultant. Translate technical evidence into plain English. Never invent numbers, names, or websites that are not in the payload. Use the exact business name provided. Never say SEO jargon without explaining it. 120-180 words. No markdown headings. No emoji.",
    user: JSON.stringify({
      business: report.entity,
      overall: report.overall,
      band: report.band,
      pillars: report.pillars,
      opportunities: report.opportunities.map((o) => ({ title: o.title, text: o.plainEnglish, severity: o.severity })),
      strengths: report.strengths.map((s) => s.title),
      live: report.liveProvidersUsed,
      opportunityZar: report.opportunity.extraRevenueMonthZar,
    }),
  });
  return text?.trim() || fallback;
}
