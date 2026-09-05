import type { Collected } from "./collectors";
import { resolvedKeys } from "./keys";
import { newId } from "./hash";
import type {
  ComparisonRow,
  Competitor,
  Entity,
  Evidence,
  Finding,
  IntegrationStatus,
  OpportunityModel,
  Pillar,
  Recommendation,
  Severity,
  SignalStatus,
  SnapshotReport,
} from "./types";

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function bandFor(score: number): string {
  if (score >= 80) return "Strong entity";
  if (score >= 72) return "Good foundation";
  if (score >= 50) return "Visible, with gaps";
  if (score >= 35) return "Under-represented";
  return "Nearly invisible";
}

type IndustryModel = {
  job: [number, number];
  competitors: string[];
  keyword: (e: Entity) => string;
};

const INDUSTRY: Record<string, IndustryModel> = {
  plumbing: {
    job: [1200, 2400],
    competitors: ["CT Plumbers", "Emergency Plumbing Cape Town", "Pro Plumb Solutions"],
    keyword: (e) => `emergency plumber ${cityOf(e)}`.toLowerCase(),
  },
  auto: {
    job: [1800, 4500],
    competitors: ["Bosch Car Service", "Tiger Wheel & Tyre", "Independent Auto"],
    keyword: (e) => `mechanic ${cityOf(e)}`.toLowerCase(),
  },
  dental: {
    job: [900, 3500],
    competitors: ["Family dental studio", "CBD dental clinic", "Orthodontic practice"],
    keyword: (e) => `dentist ${cityOf(e)}`.toLowerCase(),
  },
  default: {
    job: [900, 2800],
    competitors: ["Top local competitor", "Regional specialist", "Established rival"],
    keyword: (e) => `${e.industry} ${cityOf(e)}`.toLowerCase(),
  },
};

function cityOf(entity: Entity): string {
  return entity.location.split(",")[0]?.trim() || entity.location;
}

function industryFor(entity: Entity): IndustryModel {
  const hay = `${entity.industry} ${entity.name} ${entity.query}`.toLowerCase();
  if (/plumb/.test(hay)) return INDUSTRY.plumbing;
  if (/mechanic|auto repair|car service|panelbeat/.test(hay)) return INDUSTRY.auto;
  if (/dent/.test(hay)) return INDUSTRY.dental;
  return INDUSTRY.default;
}

function idsFor(evidence: Evidence[], ...sources: Evidence["source"][]): string[] {
  return evidence.filter((e) => sources.includes(e.source)).map((e) => e.id);
}

function makeFinding(
  pillar: Pillar,
  severity: Severity,
  title: string,
  plainEnglish: string,
  scoreImpact: number,
  evidenceIds: string[],
): Finding {
  return {
    id: newId("find"),
    pillar,
    severity,
    title,
    plainEnglish,
    evidenceIds,
    scoreImpact,
  };
}

function makeRec(
  finding: Finding,
  title: string,
  why: string,
  steps: string[],
  effort: Recommendation["effort"],
  impact: Recommendation["impact"],
  locked: boolean,
): Recommendation {
  return {
    id: newId("rec"),
    title,
    why,
    steps,
    effort,
    impact,
    pillar: finding.pillar,
    findingId: finding.id,
    locked,
  };
}

export function scoreSnapshot(
  entity: Entity,
  collected: Collected,
  evidence: Evidence[],
): Omit<SnapshotReport, "briefing" | "id" | "createdAt" | "unlocked"> {
  const keys = resolvedKeys();
  const industry = industryFor(entity);
  const site = collected.website;
  const places = collected.places;
  const speed = collected.pagespeed;
  const cse = collected.cse;
  const wiki = collected.wikipedia;
  const geo = collected.geo;

  const hasSite = Boolean(site?.reachable);
  const hasPlaces = Boolean(places);
  const placesQueried = Boolean(keys.googlePlaces);
  const reviews = places?.reviewCount ?? 0;
  const rating = places?.rating ?? 0;

  let vis = 38;
  if (geo) vis += 8;
  if (hasSite) vis += 14;
  if (hasPlaces) vis += 22;
  if (reviews >= 150) vis += 10;
  else if (reviews >= 40) vis += 6;
  else if (reviews >= 10) vis += 3;
  if (cse?.nameAppears) vis += 10;
  if (cse?.domainAppears) vis += 8;
  if (wiki?.found) vis += 4;
  if (!hasSite && !hasPlaces) vis -= 8;
  vis = clamp(vis);

  let auth = 28;
  if (geo) auth += 10;
  if (wiki?.found) auth += 28;
  if (site?.hasSchema) auth += 12;
  if (site?.sitemap.ok) auth += 6;
  if (site?.robots.ok) auth += 3;
  if ((site?.wordCount ?? 0) > 800) auth += 8;
  else if ((site?.wordCount ?? 0) > 300) auth += 4;
  auth += Math.min(12, (site?.social.length ?? 0) * 4);
  if (cse?.nameAppears) auth += 6;
  if (!hasSite) auth -= 6;
  auth = clamp(auth);

  let rep: number;
  if (hasPlaces) {
    const ratingPart = rating > 0 ? (rating / 5) * 55 : 20;
    const volumePart = Math.min(38, reviews / 5);
    rep = clamp(18 + ratingPart + volumePart);
  } else if (placesQueried) {
    rep = 26;
  } else {
    // Not queried is not the same as no reviews.
    rep = 42;
  }

  let web = 22;
  if (hasSite && site) {
    web = 36;
    if (site.https) web += 8;
    if (site.hasViewport) web += 6;
    if (site.title) web += 5;
    if (site.description) web += 5;
    if (site.hasSchema) web += 8;
    if (site.hasPhone) web += 4;
    if (site.hasAddressHint) web += 4;
    if (site.sitemap.ok) web += 6;
    if (site.robots.ok) web += 3;
    web += Math.min(8, Math.round((site.wordCount || 0) / 200));
    if (speed) {
      web = clamp(web * 0.7 + speed.performance * 0.3);
    }
  } else if (entity.website) {
    web = 28;
  }
  web = clamp(web);

  const overall = clamp(vis * 0.3 + auth * 0.22 + rep * 0.24 + web * 0.24);
  const band = bandFor(overall);

  const mapPosition = (() => {
    if (hasPlaces && reviews >= 120 && rating >= 4.5) return 3;
    if (hasPlaces && reviews >= 40 && rating >= 4.2) return 5;
    if (hasPlaces) return 8;
    if (vis >= 60) return 6;
    if (vis >= 45) return 7;
    if (vis >= 35) return 11;
    return 14;
  })();

  const mapPackEstimate = {
    position: mapPosition,
    keyword: industry.keyword(entity),
    note: hasPlaces
      ? "Estimated from listing strength versus a typical local pack. Live rank needs a SERP provider."
      : placesQueried
        ? "No Google listing came back for this name + place. Rank is inferred from weaker public signals."
        : "Estimate from public signals. Connect Places for a live listing match.",
  };

  const findings: Finding[] = [];
  const recs: Recommendation[] = [];

  const visFinding = makeFinding(
    "visibility",
    mapPosition <= 3 ? "medium" : mapPosition <= 7 ? "high" : "critical",
    mapPosition <= 3 ? "Defend your Map Pack position" : "You're not visible enough in the Google Map Pack",
    mapPosition <= 3
      ? `Signals suggest you can hold a top-three spot for “${mapPackEstimate.keyword}”, but competitors with faster review velocity will take it.`
      : `You're currently around position #${mapPosition} for “${mapPackEstimate.keyword}”. Moving into the top 3 would put you in front of people already looking to hire.`,
    mapPosition <= 3 ? 4 : 12,
    idsFor(evidence, "places", "cse", "nominatim"),
  );
  findings.push(visFinding);
  recs.push(
    makeRec(
      visFinding,
      "Optimise your Google Business Profile",
      "Categories, services, photos and a complete NAP are the shortest path into the local pack.",
      [
        "Confirm the primary category matches how customers search, then add relevant additional categories.",
        "List every service you actually sell — especially emergency / high-intent work.",
        "Upload recent, geo-relevant photos of vans, jobs and the team. Aim for 10+ this month.",
        "Make sure name, address and phone match the website and directories character-for-character.",
      ],
      "medium",
      "high",
      false,
    ),
  );

  if (!hasPlaces && !placesQueried) {
    const f = makeFinding(
      "reputation",
      "high",
      "Review velocity is unknown — and that is a risk",
      "We did not query Google Places this run, so rating and review volume are estimated. Competitors with a public review engine still rank and convert without you seeing it.",
      8,
      idsFor(evidence, "places"),
    );
    findings.push(f);
    recs.push(
      makeRec(
        f,
        "Connect Places, then build a review cadence",
        "Live ratings change both the score and the advice. Until then, start the habit.",
        [
          "Paste a Google Places API key on Integrations and re-run the audit.",
          "Ask every completed job for a review the same day — SMS or WhatsApp beats email.",
          "Reply to every review within 48 hours, including the critical ones.",
        ],
        "low",
        "high",
        false,
      ),
    );
  } else if (!hasPlaces) {
    const f = makeFinding(
      "reputation",
      "critical",
      "No Google Business listing came back",
      `We queried Places for “${entity.name}” in ${entity.location} and did not get a listing. Without one, Map Pack and review signals stay dark.`,
      14,
      idsFor(evidence, "places"),
    );
    findings.push(f);
    recs.push(
      makeRec(
        f,
        "Create or reclaim the Google Business Profile",
        "If the listing does not exist, you are invisible in the pack. If it exists under another name, claim it.",
        [
          "Search Google Maps for the exact trading name and every close variant.",
          "Create the profile if missing; request access if it already exists.",
          "Verify by postcard, phone or video, then complete every field before posting.",
        ],
        "medium",
        "high",
        false,
      ),
    );
  } else if (reviews < 80) {
    const f = makeFinding(
      "reputation",
      reviews < 20 ? "high" : "medium",
      "Your review velocity is too low compared to typical competitors",
      hasPlaces
        ? `${places?.name ?? entity.name} shows ${rating || "?"}★ from ${reviews} reviews. More recent reviews, consistently, raise both trust and rankings.`
        : "Review volume looks thin relative to local service competitors.",
      9,
      idsFor(evidence, "places"),
    );
    findings.push(f);
    recs.push(
      makeRec(
        f,
        "Build a consistent review generation process",
        "Five to ten genuine reviews a month compounds faster than any ad spend at this stage.",
        [
          "Pick one ask channel (WhatsApp is typical in South Africa) and use it after every paid job.",
          "Write a 2-line script the team can send without thinking.",
          "Do not gate or incentivise — it violates Google policy and will backfire.",
        ],
        "low",
        "high",
        false,
      ),
    );
  } else {
    const f = makeFinding(
      "reputation",
      "strength",
      "Review profile is a real asset",
      `${rating}★ from ${reviews} reviews is the kind of social proof that wins the pack — keep the cadence so it does not stall.`,
      -4,
      idsFor(evidence, "places"),
    );
    findings.push(f);
  }

  if (!hasSite) {
    const f = makeFinding(
      "website",
      "high",
      "No public website was observed",
      entity.website
        ? "A URL was provided but we could not fetch a usable page. That hurts both customers and Google."
        : "Google still needs a page it can understand — services, area, phone, and proof. Without one, the listing has nowhere to send serious buyers.",
      10,
      idsFor(evidence, "website"),
    );
    findings.push(f);
    recs.push(
      makeRec(
        f,
        "Put a simple, crawlable website live",
        "A one-pager with NAP, services and a click-to-call button already beats ‘no site’.",
        [
          "Publish a homepage with the exact trading name, city, phone and primary services.",
          "Add one page per high-intent service (for a plumber: emergency, geyser, drain, leak detection).",
          "Use HTTPS, a unique title, a meta description, and a visible address or service area.",
        ],
        "high",
        "high",
        true,
      ),
    );
  } else if (site) {
    if (!site.hasSchema || (site.wordCount ?? 0) < 400 || !site.sitemap.ok) {
      const f = makeFinding(
        "website",
        "medium",
        "The website is missing key service and entity signals",
        [
          site.hasSchema ? null : "No structured data (LocalBusiness / Service) was detected.",
          (site.wordCount ?? 0) < 400 ? `Content is thin (${site.wordCount} words) — Google cannot tell which jobs you actually want.` : null,
          site.sitemap.ok ? null : "No sitemap.xml — new service pages will be slow to surface.",
        ]
          .filter(Boolean)
          .join(" "),
        7,
        idsFor(evidence, "website", "sitemap", "robots"),
      );
      findings.push(f);
      recs.push(
        makeRec(
          f,
          "Create service-specific pages and mark the entity up",
          "Google is not 100% clear on all the services you offer. We can fix this with content and schema.",
          [
            "One URL per service × city. Title the page the way a customer would search.",
            "Add LocalBusiness JSON-LD with name, phone, address and opening hours.",
            "Ship a sitemap.xml and reference it from robots.txt.",
          ],
          "medium",
          "medium",
          true,
        ),
      );
    }
    if (speed && speed.performance < 60) {
      const f = makeFinding(
        "website",
        "medium",
        "The site loads slowly on mobile",
        `Mobile PageSpeed is ${speed.performance}/100${speed.lcpMs ? ` (LCP ${Math.round(speed.lcpMs)}ms)` : ""}. Slow pages leak both rankings and call-outs.`,
        6,
        idsFor(evidence, "pagespeed"),
      );
      findings.push(f);
      recs.push(
        makeRec(
          f,
          "Fix mobile speed on the templates customers actually hit",
          "Homepage and service pages first. Compress images, defer non-critical scripts, keep LCP under 2.5s.",
          [
            "Compress hero images and serve modern formats.",
            "Remove unused scripts; load chat/widgets after idle.",
            "Re-run PageSpeed on the homepage after the change.",
          ],
          "medium",
          "medium",
          true,
        ),
      );
    }
    if (site.https && site.hasViewport) {
      findings.push(
        makeFinding(
          "website",
          "strength",
          "Technical baseline is in place",
          `HTTPS ${site.https ? "on" : "off"}, viewport ${site.hasViewport ? "present" : "missing"}. That is table stakes — now the content has to earn the click.`,
          -2,
          idsFor(evidence, "website"),
        ),
      );
    }
  }

  if (!wiki?.found) {
    const f = makeFinding(
      "authority",
      "medium",
      "Strengthen service relevance and entity authority",
      "No Wikipedia-class entity exists for this name, which is normal for a local operator — but citations, schema and consistent NAP still have to do that job.",
      5,
      idsFor(evidence, "wikipedia", "nominatim", "website"),
    );
    findings.push(f);
    recs.push(
      makeRec(
        f,
        "Tighten citations and on-site entity markup",
        "Authority here is not a press release. It is the same name, place and phone everywhere Google already looks.",
        [
          "Audit the top 10 directories for name/address/phone mismatches.",
          "Link the same social profiles from the site footer and the Google profile.",
          "If you are a registered company, use the legal name once and the trading name consistently.",
        ],
        "medium",
        "medium",
        true,
      ),
    );
  } else {
    findings.push(
      makeFinding(
        "authority",
        "strength",
        "A public knowledge record exists",
        `Wikipedia has “${wiki.title}”. That is rare for a local service brand and lifts how assistants and search describe you.`,
        -6,
        idsFor(evidence, "wikipedia"),
      ),
    );
  }

  const strengths = findings.filter((f) => f.severity === "strength");
  const opportunities = findings
    .filter((f) => f.severity !== "strength")
    .sort((a, b) => {
      const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, strength: 4 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 3);

  recs.forEach((r, i) => {
    r.locked = i >= 3;
  });
  if (recs[0]) recs[0].locked = false;
  if (recs[1]) recs[1].locked = false;
  if (recs[2]) recs[2].locked = false;

  const visGap = (100 - vis) / 100;
  const extraEnquiriesMonth: [number, number] = [
    clamp(8 + visGap * 52, 3, 90),
    clamp(16 + visGap * 100, 12, 140),
  ];
  if (extraEnquiriesMonth[1] < extraEnquiriesMonth[0] + 8) {
    extraEnquiriesMonth[1] = extraEnquiriesMonth[0] + 8;
  }
  const extraRevenueMonthZar: [number, number] = [
    extraEnquiriesMonth[0] * industry.job[0],
    extraEnquiriesMonth[1] * industry.job[1],
  ];
  const opportunity: OpportunityModel = {
    extraEnquiriesMonth,
    avgJobValueZar: industry.job,
    extraRevenueMonthZar,
    assumptions: [
      `Uses typical ${entity.industry.toLowerCase()} job values in ${cityOf(entity)} and the gap between your visibility and a top-3 local pack. Not a forecast.`,
      "Range, not a promise. Connecting Places and PageSpeed tightens it.",
    ],
  };

  const cseNames = (cse?.topTitles ?? [])
    .map((t) => t.replace(/\s*[|\-–].*$/, "").trim())
    .filter((t) => t && !t.toLowerCase().includes(entity.name.toLowerCase().split(" ")[0] ?? "___"))
    .slice(0, 3);
  const competitors: Competitor[] = (cseNames.length ? cseNames : industry.competitors).slice(0, 3).map((name) => ({
    name,
    note: cseNames.length ? "Appeared in the Custom Search sample" : "Typical rival in this trade and city (not a live scrape)",
  }));

  const reviewScore = hasPlaces ? clamp((reviews / 180) * 100) : 22;
  const ratingScore = hasPlaces && rating ? clamp((rating / 5) * 100) : 48;
  const speedScore = speed?.performance ?? (hasSite ? 55 : 18);

  const comparison: ComparisonRow[] = [
    { metric: "Map Pack", you: clamp(100 - Math.max(0, mapPosition - 1) * 9), average: 58, top: 92 },
    { metric: "Reviews", you: reviewScore, average: 54, top: 90 },
    { metric: "Rating", you: ratingScore, average: 78, top: 96 },
    { metric: "Speed", you: speedScore, average: 62, top: 91 },
    { metric: "Authority", you: auth, average: 52, top: 86 },
  ];

  const signals: SignalStatus[] = [
    {
      id: "gbp",
      label: "Google Business Profile",
      status: hasPlaces ? "live" : placesQueried ? "missing" : "estimated",
      detail: hasPlaces
        ? `${places?.name} · ${rating || "?"}★ · ${reviews} reviews`
        : placesQueried
          ? "Queried — no listing returned"
          : "Connect Places for a live listing match",
    },
    {
      id: "web",
      label: "Website & technical",
      status: hasSite ? "live" : entity.website ? "partial" : "missing",
      detail: hasSite
        ? `${site?.url} · ${site?.wordCount} words · schema ${site?.hasSchema ? "yes" : "no"}`
        : entity.website
          ? "URL provided but not fetched as a usable page"
          : "No public website observed",
    },
    {
      id: "local",
      label: "Local search sample",
      status: cse ? "live" : "estimated",
      detail: cse
        ? `Name in results: ${cse.nameAppears ? "yes" : "no"}`
        : "Connect Custom Search for a live SERP sample",
    },
    {
      id: "reviews",
      label: "Reviews & reputation",
      status: hasPlaces ? "live" : placesQueried ? "missing" : "estimated",
      detail: hasPlaces ? `${rating}★ (${reviews})` : "Not observed this run",
    },
    {
      id: "comp",
      label: "Competitors",
      status: cseNames.length ? "partial" : "estimated",
      detail: competitors.map((c) => c.name).join(", "),
    },
    {
      id: "cite",
      label: "Citations & authority",
      status: wiki?.found || geo ? "partial" : "missing",
      detail: [geo ? "OpenStreetMap match" : "No OSM business match", wiki?.found ? `Wikipedia: ${wiki.title}` : "No Wikipedia entity"]
        .filter(Boolean)
        .join(" · "),
    },
    {
      id: "social",
      label: "Social & entity signals",
      status: (site?.social.length ?? 0) > 0 ? "live" : "missing",
      detail: site?.social.length ? site.social.join(", ") : "No social profiles linked from the site",
    },
    {
      id: "speed",
      label: "Mobile speed",
      status: speed ? "live" : hasSite ? "estimated" : "missing",
      detail: speed
        ? `${speed.performance}/100 mobile`
        : keys.googlePageSpeed
          ? "No PageSpeed result"
          : "Connect PageSpeed for a live lab run",
    },
  ];

  const integrations: IntegrationStatus[] = [
    {
      id: "places",
      name: "Google Places",
      connected: Boolean(keys.googlePlaces),
      requiredFor: "Live rating, review volume, listing match",
      how: "Paste a Places API (New) or legacy Places key on Integrations. One text-search call per audit.",
    },
    {
      id: "pagespeed",
      name: "PageSpeed Insights",
      connected: Boolean(keys.googlePageSpeed),
      requiredFor: "Live mobile performance instead of an estimate",
      how: "Paste a PageSpeed Insights key. One mobile run per audit, only if a website is observed.",
    },
    {
      id: "cse",
      name: "Google Custom Search",
      connected: Boolean(keys.googleCseKey && keys.googleCseCx),
      requiredFor: "Whether the name and domain appear in a web sample",
      how: "Paste the JSON API key and the Search Engine ID (cx).",
    },
    {
      id: "grok",
      name: "xAI Grok",
      connected: Boolean(keys.grok),
      requiredFor: "Entity extract + plain-English briefing",
      how: "Platform key — you do not paste this.",
    },
    {
      id: "nominatim",
      name: "OpenStreetMap Nominatim",
      connected: true,
      requiredFor: "Geocoding and venue corroboration",
      how: "Public endpoint. Always on.",
    },
    {
      id: "website",
      name: "Website crawler",
      connected: true,
      requiredFor: "HTTPS, schema, content, social, robots, sitemap",
      how: "Fetches the URL you confirm. Never invents a site.",
    },
  ];

  const liveProvidersUsed = [
    geo ? "OpenStreetMap" : null,
    hasSite ? "Website crawl" : null,
    hasPlaces ? "Google Places" : null,
    speed ? "PageSpeed Insights" : null,
    cse ? "Custom Search" : null,
    wiki?.found ? "Wikipedia" : null,
    keys.grok ? "Grok" : null,
  ].filter((x): x is string => Boolean(x));

  const summary =
    overall >= 72
      ? `Your digital visibility is ${band.toLowerCase()}. There is still room on the table — mostly in the gaps below.`
      : overall >= 50
        ? `Your digital visibility is a fair start, but you are leaving real opportunities on the table.`
        : `Your digital visibility is ${band.toLowerCase()}. The customers already searching are currently finding someone else.`;

  const verdict =
    overall >= 72
      ? "Protect the lead. The next points come from reviews, service pages and speed — not more ads."
      : overall >= 50
        ? "Good enough to exist, not good enough to win. The Map Pack and review cadence move the number fastest."
        : "The entity is under-built. Listing, website and reviews — in that order — before any content campaign.";

  return {
    entity,
    overall,
    band,
    summary,
    verdict,
    pillars: [
      { pillar: "visibility", score: vis, max: 100, label: "Visibility" },
      { pillar: "authority", score: auth, max: 100, label: "Authority" },
      { pillar: "reputation", score: rep, max: 100, label: "Reputation" },
      { pillar: "website", score: web, max: 100, label: "Website" },
    ],
    findings,
    strengths,
    opportunities,
    recommendations: recs,
    evidence,
    signals,
    opportunity,
    competitors,
    comparison,
    mapPackEstimate,
    review: hasPlaces ? { rating: rating || 0, count: reviews, source: "Google Places" } : null,
    integrations,
    liveProvidersUsed,
  };
}
