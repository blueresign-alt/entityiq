export type Pillar = "visibility" | "authority" | "reputation" | "website";

export type Severity = "critical" | "high" | "medium" | "low" | "strength";

export type SourceKind =
  | "user"
  | "model_prior"
  | "nominatim"
  | "website"
  | "robots"
  | "sitemap"
  | "places"
  | "pagespeed"
  | "cse"
  | "wikipedia"
  | "discover"
  | "rule";

export type IntegrationId =
  | "places"
  | "pagespeed"
  | "cse"
  | "grok"
  | "nominatim"
  | "website";

export interface Entity {
  name: string;
  location: string;
  region?: string;
  country?: string;
  industry: string;
  services: string[];
  goal: string;
  website?: string;
  phone?: string;
  query: string;
}

export interface Evidence {
  id: string;
  source: SourceKind;
  observedAt: string;
  label: string;
  value: string;
  url?: string;
  hash: string;
  live: boolean;
}

export interface Finding {
  id: string;
  pillar: Pillar;
  severity: Severity;
  title: string;
  plainEnglish: string;
  evidenceIds: string[];
  scoreImpact: number;
}

export interface Recommendation {
  id: string;
  title: string;
  why: string;
  steps: string[];
  effort: "low" | "medium" | "high";
  impact: "high" | "medium" | "low";
  pillar: Pillar;
  findingId: string;
  locked: boolean;
}

export interface PillarScore {
  pillar: Pillar;
  score: number;
  max: number;
  label: string;
}

export interface OpportunityModel {
  extraEnquiriesMonth: [number, number];
  avgJobValueZar: [number, number];
  extraRevenueMonthZar: [number, number];
  assumptions: string[];
}

export interface Competitor {
  name: string;
  note: string;
}

export interface ComparisonRow {
  metric: string;
  you: number;
  average: number;
  top: number;
}

export interface SignalStatus {
  id: string;
  label: string;
  status: "live" | "partial" | "missing" | "estimated";
  detail: string;
}

export interface IntegrationStatus {
  id: IntegrationId;
  name: string;
  connected: boolean;
  requiredFor: string;
  how: string;
}

export interface SnapshotReport {
  id: string;
  createdAt: string;
  entity: Entity;
  overall: number;
  band: string;
  summary: string;
  verdict: string;
  pillars: PillarScore[];
  findings: Finding[];
  strengths: Finding[];
  opportunities: Finding[];
  recommendations: Recommendation[];
  evidence: Evidence[];
  signals: SignalStatus[];
  opportunity: OpportunityModel;
  competitors: Competitor[];
  comparison: ComparisonRow[];
  mapPackEstimate?: { position: number | null; keyword: string; note: string };
  review?: { rating: number; count: number; source: string } | null;
  briefing: string;
  integrations: IntegrationStatus[];
  liveProvidersUsed: string[];
  unlocked: boolean;
}

export interface ExtractResult {
  entity: Entity;
  confidence: number;
  notes: string;
  matchLabel: string;
}
