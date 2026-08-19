/**
 * Resolve tutorial highlight targets in the live DOM.
 * Uses data-tutorial-target first, then data-ai-target as fallback for shell chrome.
 */

export function resolveTutorialTargetElement(targetId: string): HTMLElement | null {
  if (typeof document === "undefined" || !targetId) return null;
  const byTutorial = document.querySelector(`[data-tutorial-target="${targetId}"]`);
  if (byTutorial instanceof HTMLElement) return byTutorial;
  const byAi = document.querySelector(`[data-ai-target="${targetId}"]`);
  if (byAi instanceof HTMLElement) return byAi;
  return null;
}

export function measureTutorialTarget(targetId: string | undefined): {
  element: HTMLElement | null;
  rect: DOMRect | null;
} {
  if (!targetId) return { element: null, rect: null };
  const element = resolveTutorialTargetElement(targetId);
  if (!element) return { element: null, rect: null };
  element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  return { element, rect: element.getBoundingClientRect() };
}
