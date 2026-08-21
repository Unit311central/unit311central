import type { TutorialPresentationKind, TutorialStep } from "@/lib/guided-tutorials/types";

const DOM_HIGHLIGHT_KINDS: ReadonlySet<TutorialPresentationKind> = new Set([
  "highlight",
  "callout",
  "walkthrough",
  "try",
]);

const IMMERSIVE_KINDS: ReadonlySet<TutorialPresentationKind> = new Set([
  "diagram",
  "screenshot",
  "video",
  "animation",
]);

/** Steps that spotlight a live UI target in the page. */
export function stepUsesDomHighlight(step: TutorialStep | null | undefined): boolean {
  if (!step?.targetId) return false;
  const kind = step.presentation ?? "highlight";
  return DOM_HIGHLIGHT_KINDS.has(kind);
}

/** Steps that teach with rich panel media instead of (or as well as) a DOM target. */
export function stepUsesImmersiveMedia(step: TutorialStep | null | undefined): boolean {
  if (!step) return false;
  const kind = step.presentation;
  if (kind && IMMERSIVE_KINDS.has(kind)) return Boolean(step.media?.assetUrl);
  return false;
}

export function stepRequiresWidePanel(step: TutorialStep | null | undefined): boolean {
  return stepUsesImmersiveMedia(step);
}
