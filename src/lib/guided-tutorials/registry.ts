import { FINANCIALS_DASHBOARD_TUTORIAL } from "@/lib/guided-tutorials/content/financials-dashboard";
import { SALES_MANAGEMENT_COMMISSIONS_TUTORIAL } from "@/lib/guided-tutorials/content/sales-management-commissions";
import { WAVE_1_TUTORIAL_DEFINITIONS } from "@/lib/guided-tutorials/content/wave-1";
import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** All registered tutorials — add new entries here. */
export const TUTORIAL_REGISTRY: readonly TutorialDefinition[] = [
  FINANCIALS_DASHBOARD_TUTORIAL,
  SALES_MANAGEMENT_COMMISSIONS_TUTORIAL,
  ...WAVE_1_TUTORIAL_DEFINITIONS,
] as const;

export function listTutorialDefinitions(): readonly TutorialDefinition[] {
  return TUTORIAL_REGISTRY;
}

export function findTutorialById(tutorialId: string): TutorialDefinition | undefined {
  return TUTORIAL_REGISTRY.find((tutorial) => tutorial.tutorialId === tutorialId);
}
