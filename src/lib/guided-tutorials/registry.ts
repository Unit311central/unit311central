import { FINANCIALS_DASHBOARD_TUTORIAL } from "@/lib/guided-tutorials/content/financials-dashboard";
import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** All registered tutorials — add new entries here. */
export const TUTORIAL_REGISTRY: readonly TutorialDefinition[] = [
  FINANCIALS_DASHBOARD_TUTORIAL,
] as const;

export function listTutorialDefinitions(): readonly TutorialDefinition[] {
  return TUTORIAL_REGISTRY;
}

export function findTutorialById(tutorialId: string): TutorialDefinition | undefined {
  return TUTORIAL_REGISTRY.find((tutorial) => tutorial.tutorialId === tutorialId);
}
