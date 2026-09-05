import { createServerFn } from "@tanstack/react-start";
import { runAssessment, runExtract } from "./pipeline";
import { resolvedKeys, setOperatorKeys, type OperatorKeys, mask } from "./keys";
import type { Entity } from "./types";

export const extractBusiness = createServerFn({ method: "POST" })
  .validator((input: { prompt: string }) => input)
  .handler(async ({ data }) => {
    const prompt = data.prompt.trim().slice(0, 2000);
    if (prompt.length < 3) throw new Error("Tell us a little more about the business.");
    return runExtract(prompt);
  });

export const assessBusiness = createServerFn({ method: "POST" })
  .validator((input: { entity: Entity }) => input)
  .handler(async ({ data }) => {
    return runAssessment(data.entity);
  });

export const saveKeys = createServerFn({ method: "POST" })
  .validator((input: OperatorKeys) => input)
  .handler(async ({ data }) => {
    setOperatorKeys(data);
    return getKeyStatusHandler();
  });

function getKeyStatusHandler() {
  const k = resolvedKeys();
  return {
    grok: Boolean(k.grok),
    places: Boolean(k.googlePlaces),
    placesMasked: mask(k.googlePlaces),
    pagespeed: Boolean(k.googlePageSpeed),
    pagespeedMasked: mask(k.googlePageSpeed),
    cse: Boolean(k.googleCseKey && k.googleCseCx),
    cseKeyMasked: mask(k.googleCseKey),
    cseCxMasked: mask(k.googleCseCx),
  };
}

export const getKeyStatus = createServerFn({ method: "GET" }).handler(async () => getKeyStatusHandler());
