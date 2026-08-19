/**
 * Reusable NL normalisation for capability matching — not per-question handlers.
 */

const TYPO_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bemplo\w*d\b/gi, "employees"],
  [/\bemploye\b/gi, "employee"],
  [/\binvoc\w*s\b/gi, "invoices"],
  [/\bcustm\w*s\b/gi, "customers"],
  [/\bbal+ence\b/gi, "balance"],
  [/\bbalence\b/gi, "balance"],
  [/\bhead\s*count\b/gi, "headcount"],
  [/\bcash\s*pos\b/gi, "cash position"],
];

/** Collapse whitespace and apply light typo normalisation. */
export function normalizeEaMessage(message: string): string {
  let text = message.trim().toLowerCase().replace(/\s+/g, " ");
  for (const [pattern, replacement] of TYPO_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

const CROSS_WORKSPACE_MARKERS: Array<{ slug: string; patterns: RegExp[] }> = [
  { slug: "talantonimpact", patterns: [/\btalanton\b/i, /\btalanton\s+impact\b/i] },
  { slug: "onwardair", patterns: [/\bonward\s*air\b/i, /\bonwardair\b/i] },
  { slug: "abhi", patterns: [/\babhi\b/i] },
  { slug: "demo", patterns: [/\bnorthstar\b/i, /\bdemo\s+workspace\b/i] },
];

/**
 * Detect requests for another workspace's data (security).
 * Returns the foreign slug if probe detected, else null.
 */
export function detectCrossWorkspaceDataProbe(
  message: string,
  currentSlug: string | null | undefined,
): string | null {
  const current = String(currentSlug ?? "").trim().toLowerCase();
  const normalized = normalizeEaMessage(message);
  const mentionsForeignData =
    /\b(customers?|clients?|financials?|employees?|invoices?|pipeline|portfolio|crm|bank|cash|revenue)\b/i.test(
      normalized,
    );
  if (!mentionsForeignData) return null;

  for (const marker of CROSS_WORKSPACE_MARKERS) {
    if (marker.slug === current || current === "talanton" && marker.slug === "talantonimpact") {
      continue;
    }
    if (marker.patterns.some((p) => p.test(message))) {
      return marker.slug;
    }
  }
  return null;
}
