import type { Entity, Evidence } from "./types";
import { evidenceHash, newId } from "./hash";
import { fetchJson, fetchText } from "./fetch";
import { resolvedKeys } from "./keys";

function ev(
  source: Evidence["source"],
  label: string,
  value: string,
  extra: Partial<Evidence> = {},
): Evidence {
  const observedAt = new Date().toISOString();
  return {
    id: newId("ev"),
    source,
    observedAt,
    label,
    value,
    live: extra.live ?? true,
    hash: evidenceHash(`${source}|${label}|${value}|${observedAt}`),
    ...extra,
  };
}

export interface Collected {
  evidence: Evidence[];
  website?: {
    url: string;
    reachable: boolean;
    https: boolean;
    title?: string;
    description?: string;
    hasViewport: boolean;
    hasSchema: boolean;
    schemaTypes: string[];
    social: string[];
    hasPhone: boolean;
    hasAddressHint: boolean;
    h1: string[];
    wordCount: number;
    imageCount: number;
    robots: { ok: boolean; sitemapHint: boolean };
    sitemap: { ok: boolean };
  };
  geo?: {
    displayName: string;
    lat: string;
    lon: string;
    type: string;
  };
  places?: {
    name: string;
    address?: string;
    rating?: number;
    reviewCount?: number;
    mapsUri?: string;
    types?: string[];
    businessStatus?: string;
  };
  pagespeed?: {
    performance: number;
    lcpMs?: number;
    strategy: string;
  };
  cse?: {
    nameAppears: boolean;
    domainAppears: boolean;
    topTitles: string[];
  };
  wikipedia?: {
    found: boolean;
    title?: string;
  };
  discoveredWebsite?: string;
}

export async function discoverWebsite(entity: Entity): Promise<string | undefined> {
  if (!entity.website) return undefined;
  return entity.website.startsWith("http") ? entity.website : `https://${entity.website}`;
}

function nameTokens(name: string): string[] {
  const stop = new Set(["company", "services", "the", "and", "pty", "ltd", "business", "official"]);
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3 && !stop.has(t));
}

export async function collectNominatim(entity: Entity): Promise<Collected["geo"] | undefined> {
  const q = encodeURIComponent(`${entity.name} ${entity.location}`);
  const res = await fetchJson<Array<{ display_name: string; lat: string; lon: string; type: string }>>(
    `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=3`,
    { timeoutMs: 7000 },
  );
  const hit = res.data?.[0];
  if (!hit) {
    const loc = await fetchJson<Array<{ display_name: string; lat: string; lon: string; type: string }>>(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(entity.location)}&format=json&limit=1`,
      { timeoutMs: 6000 },
    );
    const place = loc.data?.[0];
    if (!place) return undefined;
    return { displayName: place.display_name, lat: place.lat, lon: place.lon, type: place.type };
  }
  return { displayName: hit.display_name, lat: hit.lat, lon: hit.lon, type: hit.type };
}

function extractSocial(html: string): string[] {
  const found = new Set<string>();
  const patterns: [RegExp, string][] = [
    [/facebook\.com\/[A-Za-z0-9._-]+/i, "Facebook"],
    [/instagram\.com\/[A-Za-z0-9._-]+/i, "Instagram"],
    [/linkedin\.com\/(?:company|in)\/[A-Za-z0-9._-]+/i, "LinkedIn"],
    [/youtube\.com\/(?:@|channel\/|c\/)[A-Za-z0-9._-]+/i, "YouTube"],
    [/tiktok\.com\/@[A-Za-z0-9._-]+/i, "TikTok"],
    [/(?:twitter|x)\.com\/[A-Za-z0-9._-]+/i, "X"],
  ];
  for (const [re, label] of patterns) {
    if (re.test(html)) found.add(label);
  }
  return [...found];
}

function extractSchemaTypes(html: string): string[] {
  const types: string[] = [];
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of blocks) {
    try {
      const json = JSON.parse(block[1] ?? "{}") as { "@type"?: string | string[]; "@graph"?: { "@type"?: string | string[] }[] };
      const push = (t?: string | string[]) => {
        if (!t) return;
        for (const x of Array.isArray(t) ? t : [t]) types.push(String(x));
      };
      push(json["@type"]);
      json["@graph"]?.forEach((n) => push(n["@type"]));
    } catch {
      /* ignore malformed json-ld */
    }
  }
  if (/itemtype=["']https?:\/\/schema\.org\//i.test(html)) types.push("Microdata");
  return [...new Set(types)];
}

export async function collectWebsite(url: string): Promise<Collected["website"]> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const page = await fetchText(target, { timeoutMs: 9000 });
  const html = page.text.slice(0, 350_000);
  const origin = (() => {
    try {
      return new URL(page.finalUrl || target).origin;
    } catch {
      return target;
    }
  })();

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim();
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1];
  const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((m) => m[1]?.replace(/<[^>]+>/g, "").trim() ?? "")
    .filter(Boolean)
    .slice(0, 4);
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  const wordCount = text.split(/\s+/).filter((w) => w.length > 2).length;
  const imageCount = (html.match(/<img\b/gi) ?? []).length;
  const schemaTypes = extractSchemaTypes(html);
  const social = extractSocial(html);
  const hasPhone = /tel:|\+\d[\d\s()-]{7,}/i.test(html);
  const hasAddressHint = /street|road|avenue|cape town|gauteng|western cape|address/i.test(html);
  const hasViewport = /name=["']viewport["']/i.test(html);
  const https = (page.finalUrl || target).startsWith("https://");

  const robotsP = fetchText(`${origin}/robots.txt`, { timeoutMs: 5000 });
  const sitemapP = fetchText(`${origin}/sitemap.xml`, { timeoutMs: 5000 });
  const [robots, sitemap] = await Promise.all([robotsP, sitemapP]);

  return {
    url: page.finalUrl || target,
    reachable: page.ok && html.length > 200,
    https,
    title,
    description,
    hasViewport,
    hasSchema: schemaTypes.length > 0,
    schemaTypes,
    social,
    hasPhone,
    hasAddressHint,
    h1,
    wordCount,
    imageCount,
    robots: { ok: robots.ok, sitemapHint: /sitemap:/i.test(robots.text) },
    sitemap: { ok: sitemap.ok && /<urlset|<sitemapindex/i.test(sitemap.text) },
  };
}

async function verifiedWebsite(url: string, entity: Entity, providedByUser: boolean): Promise<Collected["website"] | undefined> {
  const site = await collectWebsite(url);
  if (!site) return undefined;
  if (providedByUser) return site;
  if (!site.reachable) return undefined;
  const hay = `${site.title ?? ""} ${site.h1.join(" ")} ${site.url}`.toLowerCase();
  const tokens = nameTokens(entity.name);
  if (tokens.length === 0) return undefined;
  return tokens.some((t) => hay.includes(t)) ? site : undefined;
}

export async function collectPlaces(entity: Entity): Promise<Collected["places"] | undefined> {
  const key = resolvedKeys().googlePlaces;
  if (!key) return undefined;
  const query = `${entity.name} ${entity.location}`;

  const modern = await fetchJson<{
    places?: Array<{
      displayName?: { text?: string };
      formattedAddress?: string;
      rating?: number;
      userRatingCount?: number;
      googleMapsUri?: string;
      types?: string[];
      businessStatus?: string;
    }>;
  }>("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    timeoutMs: 8000,
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.types,places.businessStatus",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1, languageCode: "en" }),
  });

  const place = modern.data?.places?.[0];
  if (modern.ok && place) {
    return {
      name: place.displayName?.text ?? entity.name,
      address: place.formattedAddress,
      rating: place.rating,
      reviewCount: place.userRatingCount,
      mapsUri: place.googleMapsUri,
      types: place.types,
      businessStatus: place.businessStatus,
    };
  }

  const legacy = await fetchJson<{
    candidates?: Array<{
      name?: string;
      formatted_address?: string;
      rating?: number;
      user_ratings_total?: number;
    }>;
  }>(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=name,formatted_address,rating,user_ratings_total&key=${encodeURIComponent(key)}`,
    { timeoutMs: 8000 },
  );
  const cand = legacy.data?.candidates?.[0];
  if (!cand) return undefined;
  return {
    name: cand.name ?? entity.name,
    address: cand.formatted_address,
    rating: cand.rating,
    reviewCount: cand.user_ratings_total,
  };
}

export async function collectPageSpeed(url: string): Promise<Collected["pagespeed"] | undefined> {
  const key = resolvedKeys().googlePageSpeed;
  if (!key) return undefined;
  const res = await fetchJson<{
    lighthouseResult?: { categories?: { performance?: { score?: number } }; audits?: { "largest-contentful-paint"?: { numericValue?: number } } };
  }>(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${encodeURIComponent(key)}&strategy=mobile&category=performance`,
    { timeoutMs: 18000 },
  );
  const score = res.data?.lighthouseResult?.categories?.performance?.score;
  if (typeof score !== "number") return undefined;
  return {
    performance: Math.round(score * 100),
    lcpMs: res.data?.lighthouseResult?.audits?.["largest-contentful-paint"]?.numericValue,
    strategy: "mobile",
  };
}

export async function collectCse(entity: Entity): Promise<Collected["cse"] | undefined> {
  const { googleCseKey, googleCseCx } = resolvedKeys();
  if (!googleCseKey || !googleCseCx) return undefined;
  const q = encodeURIComponent(`${entity.name} ${entity.location}`);
  const res = await fetchJson<{ items?: Array<{ title?: string; link?: string }> }>(
    `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(googleCseKey)}&cx=${encodeURIComponent(googleCseCx)}&q=${q}&num=8`,
    { timeoutMs: 8000 },
  );
  const items = res.data?.items ?? [];
  if (!res.ok) return undefined;
  const host = entity.website
    ? (() => {
        try {
          return new URL(entity.website.startsWith("http") ? entity.website : `https://${entity.website}`).hostname.replace(/^www\./, "");
        } catch {
          return null;
        }
      })()
    : null;
  const name = entity.name.toLowerCase();
  return {
    nameAppears: items.some((i) => (i.title ?? "").toLowerCase().includes(name) || (i.link ?? "").toLowerCase().includes(name.replace(/\s+/g, ""))),
    domainAppears: host ? items.some((i) => (i.link ?? "").includes(host)) : false,
    topTitles: items.map((i) => i.title ?? "").filter(Boolean).slice(0, 5),
  };
}

export async function collectWikipedia(entity: Entity): Promise<Collected["wikipedia"]> {
  const res = await fetchJson<{ query?: { search?: Array<{ title: string }> } }>(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(entity.name)}&utf8=&format=json&srlimit=3&origin=*`,
    { timeoutMs: 6000 },
  );
  const titles = res.data?.query?.search?.map((s) => s.title) ?? [];
  const match = titles.find((t) => isEntityWikiTitle(entity.name, t));
  return match ? { found: true, title: match } : { found: false };
}

function isEntityWikiTitle(name: string, title: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (norm(name) === norm(title)) return true;
  const stop = new Set([
    "cape",
    "town",
    "south",
    "africa",
    "western",
    "eastern",
    "northern",
    "southern",
    "gauteng",
    "kwazulu",
    "natal",
    "port",
    "city",
    "bay",
    "beach",
    "park",
    "village",
    "the",
    "and",
    "business",
    "company",
    "services",
    "service",
    "pty",
    "ltd",
    "official",
    "plumbing",
    "plumber",
    "dental",
    "dentist",
    "mechanic",
    "auto",
    "repair",
    "emergency",
    "residential",
  ]);
  const tokens = name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3 && !stop.has(t));
  if (tokens.length < 2) return false;
  const hay = title.toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

export function evidenceFromCollected(entity: Entity, c: Collected): Evidence[] {
  const out: Evidence[] = [
    ev("user", "Submitted identity", `${entity.name} · ${entity.location}`, { live: true }),
  ];
  if (c.discoveredWebsite) {
    out.push(ev("discover", "Discovered website candidate", c.discoveredWebsite, { url: c.discoveredWebsite }));
  }
  if (c.geo) {
    out.push(
      ev("nominatim", "OpenStreetMap match", `${c.geo.displayName} (${c.geo.lat}, ${c.geo.lon})`),
    );
  } else {
    out.push(ev("nominatim", "OpenStreetMap match", "No OSM record for this business name + location"));
  }
  if (c.website) {
    const w = c.website;
    out.push(ev("website", "Website reachable", w.reachable ? `Yes · ${w.url}` : `No · ${w.url}`, { url: w.url }));
    out.push(ev("website", "HTTPS", w.https ? "Enabled" : "Not using HTTPS", { url: w.url }));
    out.push(ev("website", "Document title", w.title || "Missing <title>"));
    out.push(ev("website", "Meta description", w.description || "Missing"));
    out.push(ev("website", "Viewport (mobile hint)", w.hasViewport ? "Present" : "Missing"));
    out.push(ev("website", "Structured data", w.hasSchema ? w.schemaTypes.join(", ") : "None detected"));
    out.push(ev("website", "On-page phone", w.hasPhone ? "Present" : "Not found"));
    out.push(ev("website", "Address hint on site", w.hasAddressHint ? "Present" : "Weak / missing"));
    out.push(ev("website", "Content depth", `${w.wordCount} words · ${w.imageCount} images · ${w.h1.length} H1s`));
    out.push(ev("website", "Social profiles linked", w.social.length ? w.social.join(", ") : "None detected"));
    out.push(ev("robots", "robots.txt", w.robots.ok ? (w.robots.sitemapHint ? "Present, sitemap referenced" : "Present") : "Missing or blocked"));
    out.push(ev("sitemap", "sitemap.xml", w.sitemap.ok ? "Present" : "Missing"));
  } else {
    out.push(ev("website", "Website", "No public website observed"));
  }
  if (c.places) {
    const p = c.places;
    out.push(
      ev("places", "Google Places listing", `${p.name} · ${p.address ?? "address n/a"} · ${p.rating ?? "?"}★ (${p.reviewCount ?? 0} reviews)`, {
        url: p.mapsUri,
      }),
    );
  } else {
    out.push(
      ev("places", "Google Places listing", resolvedKeys().googlePlaces ? "No listing returned" : "Not queried — Places API key not connected", {
        live: Boolean(resolvedKeys().googlePlaces),
      }),
    );
  }
  if (c.pagespeed) {
    out.push(
      ev("pagespeed", "Mobile PageSpeed", `${c.pagespeed.performance}/100${c.pagespeed.lcpMs ? ` · LCP ${Math.round(c.pagespeed.lcpMs)}ms` : ""}`),
    );
  } else {
    out.push(
      ev("pagespeed", "Mobile PageSpeed", resolvedKeys().googlePageSpeed ? "No result" : "Not queried — PageSpeed key not connected", {
        live: Boolean(resolvedKeys().googlePageSpeed),
      }),
    );
  }
  if (c.cse) {
    out.push(
      ev("cse", "Google Search sample", `Name in results: ${c.cse.nameAppears ? "yes" : "no"} · Domain in results: ${c.cse.domainAppears ? "yes" : "no"}`),
    );
  } else {
    out.push(
      ev("cse", "Google Search sample", resolvedKeys().googleCseKey ? "No result" : "Not queried — Custom Search key not connected", {
        live: Boolean(resolvedKeys().googleCseKey && resolvedKeys().googleCseCx),
      }),
    );
  }
  out.push(
    ev("wikipedia", "Wikipedia entity", c.wikipedia?.found ? `Found · ${c.wikipedia.title}` : "No matching Wikipedia article"),
  );
  return out;
}

export async function collectAll(entity: Entity): Promise<Collected> {
  const provided = Boolean(entity.website);
  const discoveredWebsite = await discoverWebsite(entity);
  const siteUrl = discoveredWebsite;

  const [geo, websiteRaw, places, wikipedia, cse] = await Promise.all([
    collectNominatim(entity),
    siteUrl ? verifiedWebsite(siteUrl, entity, provided) : Promise.resolve(undefined),
    collectPlaces(entity),
    collectWikipedia(entity),
    collectCse(entity),
  ]);

  const website = websiteRaw;
  const pagespeed =
    website?.url && resolvedKeys().googlePageSpeed ? await collectPageSpeed(website.url) : undefined;

  return {
    evidence: [],
    website,
    geo,
    places,
    pagespeed,
    cse,
    wikipedia,
    discoveredWebsite: website?.url ?? (provided ? discoveredWebsite : undefined),
  };
}
