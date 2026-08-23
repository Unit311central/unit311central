import type { QaElementContext } from "@/lib/qa-workspace/types";

const SKIP_ANCESTOR_SELECTORS = [
  "[data-qa-overlay]",
  "[data-qa-dialog]",
  "nav",
  "aside",
  "[data-ai-target='platform-nav']",
  "[data-ai-target='page-header']",
].join(",");

/** Layout wrappers — too broad for element-level QA capture. */
export const BROAD_AI_TARGET_IDS = new Set([
  "home-tiles",
  "page-main",
  "fundraising-kpis",
  "engineering-kpis",
  "support-workspace",
  "support-kpis",
  "finance-kpis",
]);

const MEANINGFUL_SELECTOR = [
  "[data-qa-target]",
  "[data-ai-target]",
  "button",
  "a[href]",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[role='tab']",
  "[role='link']",
  "th",
  "td",
  "label",
  "h1",
  "h2",
  "h3",
  "h4",
  "summary",
  "[data-slot='card']",
  "article",
  ".rounded-xl.border",
  ".rounded-\\[12px\\].border",
  ".rounded-\\[10px\\].border",
].join(",");

export type QaElementSnapshot = {
  tagName: string;
  className: string;
  role: string | null;
  dataAiTarget: string | null;
  dataQaTarget: string | null;
  textContentLength: number;
  childElementCount: number;
};

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function inferElementType(element: HTMLElement): string {
  const explicit = element.getAttribute("data-qa-type");
  if (explicit) return explicit;
  const tag = element.tagName.toLowerCase();
  if (tag === "button" || element.getAttribute("role") === "button") return "button";
  if (tag === "a") return "link";
  if (tag === "input") return `input:${element.getAttribute("type") ?? "text"}`;
  if (tag === "select") return "select";
  if (tag === "textarea") return "textarea";
  if (tag === "th" || tag === "td") return "table-cell";
  if (tag.startsWith("h")) return "heading";
  if (element.getAttribute("role") === "tab") return "tab";
  if (tag === "article") return "tile";
  return tag;
}

function resolveElementLabel(element: HTMLElement): string {
  const explicit =
    element.getAttribute("data-qa-label") ??
    element.getAttribute("aria-label") ??
    element.getAttribute("title");
  if (explicit?.trim()) return normalizeText(explicit);

  if (element.getAttribute("data-qa-target") === "dashboard-widget") {
    const firstLabel = element.querySelector("p");
    const labelText = normalizeText(firstLabel?.textContent);
    if (labelText) return labelText;
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      const labelNode = document.getElementById(labelledBy);
      const labelText = normalizeText(labelNode?.textContent);
      if (labelText) return labelText;
    }
    const fieldLabel = element.closest("label")?.textContent;
    if (fieldLabel) return normalizeText(fieldLabel);
    if (element.placeholder) return normalizeText(element.placeholder);
    if (element.name) return normalizeText(element.name);
  }

  const text = normalizeText(element.textContent);
  if (text) return text;

  const aiTarget = element.getAttribute("data-ai-target");
  if (aiTarget) return normalizeText(aiTarget);

  const qaTarget = element.getAttribute("data-qa-target");
  if (qaTarget) return normalizeText(qaTarget);

  return inferElementType(element);
}

export function snapshotQaElement(element: HTMLElement): QaElementSnapshot {
  return {
    tagName: element.tagName.toLowerCase(),
    className: typeof element.className === "string" ? element.className : "",
    role: element.getAttribute("role"),
    dataAiTarget: element.getAttribute("data-ai-target"),
    dataQaTarget: element.getAttribute("data-qa-target"),
    textContentLength: (element.textContent ?? "").replace(/\s+/g, " ").trim().length,
    childElementCount: element.childElementCount,
  };
}

export function isBroadLayoutContainerSnapshot(snapshot: QaElementSnapshot): boolean {
  if (snapshot.dataAiTarget && BROAD_AI_TARGET_IDS.has(snapshot.dataAiTarget)) {
    return true;
  }
  if (
    snapshot.dataAiTarget?.endsWith("-kpis") &&
    snapshot.childElementCount >= 2 &&
    (snapshot.tagName === "section" || snapshot.tagName === "div")
  ) {
    return true;
  }
  return false;
}

export function isDashboardWidgetShellSnapshot(snapshot: QaElementSnapshot): boolean {
  if (snapshot.tagName !== "div" && snapshot.tagName !== "section") return false;
  const cls = snapshot.className;
  if (cls.includes("rounded-[12px]") && /\bborder\b/.test(cls)) return true;
  if (cls.includes("rounded-[10px]") && /\bborder\b/.test(cls)) return true;
  return false;
}

export function isDashboardTileArticleSnapshot(snapshot: QaElementSnapshot): boolean {
  return (
    snapshot.tagName === "article" &&
    /\brounded-xl\b/.test(snapshot.className) &&
    /\bborder\b/.test(snapshot.className)
  );
}

export function qaElementSpecificityScore(snapshot: QaElementSnapshot): number {
  if (isBroadLayoutContainerSnapshot(snapshot)) return -1;

  let score = 0;
  const tag = snapshot.tagName;

  if (tag === "button" || tag === "a" || tag === "input" || tag === "select" || tag === "textarea") {
    score += 100;
  }
  if (snapshot.role === "button" || snapshot.role === "tab" || snapshot.role === "link") {
    score += 95;
  }
  if (tag === "th" || tag === "td") score += 90;
  if (snapshot.dataQaTarget) score += 85;
  if (snapshot.dataAiTarget && !isBroadLayoutContainerSnapshot(snapshot)) score += 70;
  if (isDashboardTileArticleSnapshot(snapshot)) score += 80;
  if (isDashboardWidgetShellSnapshot(snapshot)) score += 80;
  if (/^h[1-4]$/.test(tag)) score += 65;
  if (tag === "label") score += 60;
  if (tag === "summary") score += 55;

  if (
    tag === "div" &&
    /\brounded-xl\b/.test(snapshot.className) &&
    /\bborder\b/.test(snapshot.className)
  ) {
    score += 35;
    if (snapshot.textContentLength > 120) score -= 30;
    if (snapshot.textContentLength > 280) score -= 80;
  }

  return score;
}

export function isCapturableQaSnapshot(snapshot: QaElementSnapshot): boolean {
  return qaElementSpecificityScore(snapshot) > 0;
}

/** Pick the best candidate index from a click-target ancestor chain (index 0 = target). */
export function pickBestQaCandidateIndex(snapshots: QaElementSnapshot[]): number | null {
  let bestIndex: number | null = null;
  let bestScore = -1;

  for (let index = 0; index < snapshots.length; index += 1) {
    const snapshot = snapshots[index];
    if (!isCapturableQaSnapshot(snapshot)) continue;
    const score = qaElementSpecificityScore(snapshot);
    if (bestIndex === null || score > bestScore || (score === bestScore && index < bestIndex)) {
      bestIndex = index;
      bestScore = score;
    }
  }

  return bestIndex;
}

function isSkippedElement(element: HTMLElement): boolean {
  return element.matches(SKIP_ANCESTOR_SELECTORS);
}

function collectAncestorChain(target: Element): HTMLElement[] {
  const chain: HTMLElement[] = [];
  let current: Element | null = target;
  while (current) {
    if (current instanceof HTMLElement) {
      chain.push(current);
      if (current.matches('[data-ai-target="page-main"]')) break;
    }
    current = current.parentElement;
  }
  return chain;
}

export function isQaOverlayElement(element: Element | null): boolean {
  if (!element) return false;
  return Boolean(element.closest("[data-qa-overlay], [data-qa-dialog]"));
}

export function resolveQaElementFromTarget(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  if (isQaOverlayElement(target)) return null;
  if (target.closest(SKIP_ANCESTOR_SELECTORS)) return null;

  const chain = collectAncestorChain(target);
  const snapshots = chain.map(snapshotQaElement);
  const bestIndex = pickBestQaCandidateIndex(snapshots);
  if (bestIndex === null) return null;

  const match = chain[bestIndex];
  if (isQaOverlayElement(match)) return null;
  if (isSkippedElement(match)) return null;
  return match;
}

export function describeQaElement(element: HTMLElement): QaElementContext {
  const elementId =
    element.getAttribute("data-qa-id") ??
    element.getAttribute("data-ai-target") ??
    element.getAttribute("id") ??
    element.getAttribute("name");

  return {
    elementLabel: resolveElementLabel(element),
    elementType: inferElementType(element),
    elementId: elementId ? normalizeText(elementId) : null,
  };
}

export function listQaOutlineTargets(root: ParentNode): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(MEANINGFUL_SELECTOR);
  const results: HTMLElement[] = [];
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) continue;
    if (node.closest(SKIP_ANCESTOR_SELECTORS)) continue;
    if (node.offsetParent === null && node.tagName !== "TD" && node.tagName !== "TH") continue;
    if (!isCapturableQaSnapshot(snapshotQaElement(node))) continue;
    const label = resolveElementLabel(node);
    if (!label) continue;
    results.push(node);
  }
  return results;
}
