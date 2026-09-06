import { WOLF_MODEL_TESTING_ARCH_CATEGORY_ID } from "@/lib/wolf/wolf-model-testing-arch-types";
import { WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID } from "@/lib/wolf/wolf-mission2-model-testing-arch-types";

/** Parent navigation area under WOLF — not a diagram slug. */
export const WOLF_MODEL_TESTING_ARCH_AREA_ID = "model-testing-architecture";

export const WOLF_MODEL_TESTING_ARCH_AREA_LABEL = "Model Testing Architecture";

export type WolfModelTestingMissionSlug =
  | typeof WOLF_MODEL_TESTING_ARCH_CATEGORY_ID
  | typeof WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID;

export const WOLF_MODEL_TESTING_MISSIONS: ReadonlyArray<{
  slug: WolfModelTestingMissionSlug;
  title: string;
}> = [
  {
    slug: WOLF_MODEL_TESTING_ARCH_CATEGORY_ID,
    title: "Mission 1 — Animal Detection & Counting",
  },
  {
    slug: WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID,
    title: "Mission 2 — Animal Injury / Welfare",
  },
];

const MODEL_TESTING_MISSION_SLUGS = new Set<string>(
  WOLF_MODEL_TESTING_MISSIONS.map((mission) => mission.slug),
);

export function isWolfModelTestingMissionSlug(
  slug: string | null | undefined,
): slug is WolfModelTestingMissionSlug {
  return MODEL_TESTING_MISSION_SLUGS.has(String(slug ?? "").trim());
}

/** Slugs that belong in the general WOLF diagram bar (exclude mission model-testing diagrams). */
export function isWolfGeneralArchitectureDiagramSlug(slug: string | null | undefined): boolean {
  const normalized = String(slug ?? "").trim();
  if (!normalized) return false;
  return !isWolfModelTestingMissionSlug(normalized);
}

export function filterWolfGeneralDiagramTabs<T extends { slug: string }>(tabs: T[]): T[] {
  return tabs.filter((tab) => isWolfGeneralArchitectureDiagramSlug(tab.slug));
}

/** Mission slugs only — excludes unrelated architecture diagrams. */
export function getWolfModelTestingMissionSlugs(): WolfModelTestingMissionSlug[] {
  return WOLF_MODEL_TESTING_MISSIONS.map((mission) => mission.slug);
}
