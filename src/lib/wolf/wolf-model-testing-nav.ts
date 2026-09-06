import { WOLF_MODEL_TESTING_ARCH_CATEGORY_ID } from "@/lib/wolf/wolf-model-testing-arch-types";
import { WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID } from "@/lib/wolf/wolf-mission2-model-testing-arch-types";

/** Parent navigation area under WOLF — not a diagram slug. */
export const WOLF_MODEL_TESTING_ARCH_AREA_ID = "model-testing-architecture";

export const WOLF_MODEL_TESTING_ARCH_AREA_LABEL = "Model Testing Architecture";

/** Primary WOLF architecture diagram slugs shown as top-level peers of Model Testing. */
export const WOLF_IR_PRIMARY_DIAGRAM_SLUGS = {
  wolfAiArchitecture: "wolf-ai-models",
  wolfIntelligence: "wolf-intelligence",
} as const;

/** User-facing labels for primary WOLF architecture areas (slug unchanged in storage). */
export const WOLF_IR_PRIMARY_DIAGRAM_LABELS: Record<
  (typeof WOLF_IR_PRIMARY_DIAGRAM_SLUGS)[keyof typeof WOLF_IR_PRIMARY_DIAGRAM_SLUGS],
  string
> = {
  "wolf-ai-models": "WOLF AI Architecture",
  "wolf-intelligence": "WOLF Intelligence",
};

export const WOLF_IR_PRIMARY_DIAGRAM_NAV_ORDER = [
  WOLF_IR_PRIMARY_DIAGRAM_SLUGS.wolfAiArchitecture,
  WOLF_IR_PRIMARY_DIAGRAM_SLUGS.wolfIntelligence,
] as const;

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

export function isWolfPrimaryArchitectureDiagramSlug(
  slug: string | null | undefined,
): slug is (typeof WOLF_IR_PRIMARY_DIAGRAM_NAV_ORDER)[number] {
  return (WOLF_IR_PRIMARY_DIAGRAM_NAV_ORDER as readonly string[]).includes(String(slug ?? "").trim());
}

/** Primary top-level WOLF architecture tabs (WOLF AI Architecture, WOLF Intelligence). */
export function filterWolfPrimaryDiagramTabs<T extends { slug: string }>(tabs: T[]): T[] {
  return WOLF_IR_PRIMARY_DIAGRAM_NAV_ORDER.flatMap((slug) => {
    const tab = tabs.find((entry) => entry.slug === slug);
    return tab ? [tab] : [];
  });
}

/** Remaining WOLF diagrams (workspace, PAILEX, custom) — excludes missions and primary slugs. */
export function filterWolfSecondaryDiagramTabs<T extends { slug: string }>(tabs: T[]): T[] {
  return tabs.filter(
    (tab) =>
      isWolfGeneralArchitectureDiagramSlug(tab.slug) &&
      !isWolfPrimaryArchitectureDiagramSlug(tab.slug),
  );
}

export function filterWolfGeneralDiagramTabs<T extends { slug: string }>(tabs: T[]): T[] {
  return tabs.filter((tab) => isWolfGeneralArchitectureDiagramSlug(tab.slug));
}

export function resolveWolfDiagramNavLabel(slug: string, fallbackTitle: string): string {
  return WOLF_IR_PRIMARY_DIAGRAM_LABELS[slug as keyof typeof WOLF_IR_PRIMARY_DIAGRAM_LABELS] ?? fallbackTitle;
}

/** Mission slugs only — excludes unrelated architecture diagrams. */
export function getWolfModelTestingMissionSlugs(): WolfModelTestingMissionSlug[] {
  return WOLF_MODEL_TESTING_MISSIONS.map((mission) => mission.slug);
}
