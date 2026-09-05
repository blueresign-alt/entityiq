export type OperatorKeys = {
  googlePlaces?: string;
  googlePageSpeed?: string;
  googleCseKey?: string;
  googleCseCx?: string;
};

const memory: OperatorKeys = {};

export function setOperatorKeys(next: OperatorKeys) {
  if (next.googlePlaces !== undefined) memory.googlePlaces = next.googlePlaces.trim();
  if (next.googlePageSpeed !== undefined) memory.googlePageSpeed = next.googlePageSpeed.trim();
  if (next.googleCseKey !== undefined) memory.googleCseKey = next.googleCseKey.trim();
  if (next.googleCseCx !== undefined) memory.googleCseCx = next.googleCseCx.trim();
}

export function resolvedKeys(): Required<{
  googlePlaces: string | undefined;
  googlePageSpeed: string | undefined;
  googleCseKey: string | undefined;
  googleCseCx: string | undefined;
  grok: string | undefined;
}> {
  return {
    googlePlaces: memory.googlePlaces || process.env.GOOGLE_PLACES_API_KEY,
    googlePageSpeed: memory.googlePageSpeed || process.env.GOOGLE_PAGESPEED_API_KEY,
    googleCseKey: memory.googleCseKey || process.env.GOOGLE_CSE_KEY,
    googleCseCx: memory.googleCseCx || process.env.GOOGLE_CSE_CX,
    grok: process.env.XAI_API_KEY,
  };
}

export function mask(value?: string): string {
  if (!value) return "";
  if (value.length < 8) return "••••";
  return `${value.slice(0, 4)}…${value.slice(-3)}`;
}
