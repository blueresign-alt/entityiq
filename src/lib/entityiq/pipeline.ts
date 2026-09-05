import { collectAll, evidenceFromCollected } from "./collectors";
import { extractEntity, writeBriefing } from "./ai";
import { scoreSnapshot } from "./scoring";
import type { Entity, ExtractResult, SnapshotReport } from "./types";
import { newId } from "./hash";

export async function runExtract(prompt: string): Promise<ExtractResult> {
  return extractEntity(prompt);
}

export async function runAssessment(entity: Entity): Promise<SnapshotReport> {
  const collected = await collectAll(entity);
  if (collected.discoveredWebsite && !entity.website) {
    entity = { ...entity, website: collected.discoveredWebsite };
  }
  const evidence = evidenceFromCollected(entity, collected);
  collected.evidence = evidence;
  const scored = scoreSnapshot(entity, collected, evidence);
  const briefing = await writeBriefing(scored);
  return {
    ...scored,
    id: newId("rep"),
    createdAt: new Date().toISOString(),
    briefing,
    unlocked: false,
  };
}
