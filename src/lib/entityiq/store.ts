import { create } from "zustand";
import type { Entity, ExtractResult, SnapshotReport } from "./types";

const REPORT_KEY = "entityiq.report.v1";
const ENTITY_KEY = "entityiq.entity.v1";
const THEME_KEY = "entityiq.theme";

export type Theme = "dark" | "light";

interface AppState {
  prompt: string;
  extract?: ExtractResult;
  entity?: Entity;
  report?: SnapshotReport;
  theme: Theme;
  setPrompt: (p: string) => void;
  setExtract: (e: ExtractResult) => void;
  setEntity: (e: Entity) => void;
  setReport: (r: SnapshotReport) => void;
  unlock: () => void;
  setTheme: (t: Theme) => void;
  hydrate: () => void;
}

function persistReport(report?: SnapshotReport) {
  if (typeof window === "undefined" || !report) return;
  localStorage.setItem(REPORT_KEY, JSON.stringify(report));
}

function persistEntity(entity?: Entity, extract?: ExtractResult) {
  if (typeof window === "undefined" || !entity) return;
  localStorage.setItem(ENTITY_KEY, JSON.stringify({ entity, extract, prompt: entity.query }));
}

export const useApp = create<AppState>((set, get) => ({
  prompt: "",
  theme: "dark",
  setPrompt: (prompt) => set({ prompt }),
  setExtract: (extract) => {
    persistEntity(extract.entity, extract);
    set({ extract, entity: extract.entity });
  },
  setEntity: (entity) => {
    persistEntity(entity, get().extract);
    set({ entity });
  },
  setReport: (report) => {
    persistReport(report);
    persistEntity(report.entity, get().extract);
    set({ report, entity: report.entity });
  },
  unlock: () => {
    const report = get().report;
    if (!report) return;
    const next = { ...report, unlocked: true };
    persistReport(next);
    set({ report: next });
  },
  setTheme: (theme) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem(THEME_KEY, theme);
    }
    set({ theme });
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    const theme = (localStorage.getItem(THEME_KEY) as Theme) || "dark";
    document.documentElement.setAttribute("data-theme", theme);
    let report: SnapshotReport | undefined;
    let entity: Entity | undefined;
    let extract: ExtractResult | undefined;
    let prompt = "";
    try {
      const raw = localStorage.getItem(REPORT_KEY);
      if (raw) report = JSON.parse(raw) as SnapshotReport;
    } catch {
      report = undefined;
    }
    try {
      const raw = localStorage.getItem(ENTITY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { entity?: Entity; extract?: ExtractResult; prompt?: string };
        entity = parsed.entity;
        extract = parsed.extract;
        prompt = parsed.prompt ?? "";
      }
    } catch {
      /* ignore */
    }
    entity = entity ?? report?.entity;
    prompt = prompt || report?.entity.query || "";
    set({ theme, report, entity, extract, prompt });
  },
}));
