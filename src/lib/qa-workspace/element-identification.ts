import type { QaElementContext } from "@/lib/qa-workspace/types";

const SKIP_ANCESTOR_SELECTORS = [
  "[data-qa-overlay]",
  "[data-qa-dialog]",
  "nav",
  "aside",
  "[data-ai-target='platform-nav']",
  "[data-ai-target='page-header']",
].join(",");

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
  ".rounded-xl.border",
].join(",");

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
  return tag;
}

function resolveElementLabel(element: HTMLElement): string {
  const explicit =
    element.getAttribute("data-qa-label") ??
    element.getAttribute("aria-label") ??
    element.getAttribute("title");
  if (explicit?.trim()) return normalizeText(explicit);

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

export function isQaOverlayElement(element: Element | null): boolean {
  if (!element) return false;
  return Boolean(element.closest("[data-qa-overlay], [data-qa-dialog]"));
}

export function resolveQaElementFromTarget(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  if (isQaOverlayElement(target)) return null;
  if (target.closest(SKIP_ANCESTOR_SELECTORS)) return null;

  const match = target.closest(MEANINGFUL_SELECTOR);
  if (!(match instanceof HTMLElement)) return null;
  if (isQaOverlayElement(match)) return null;
  if (match.closest(SKIP_ANCESTOR_SELECTORS)) return null;
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
    const label = resolveElementLabel(node);
    if (!label) continue;
    results.push(node);
  }
  return results;
}
