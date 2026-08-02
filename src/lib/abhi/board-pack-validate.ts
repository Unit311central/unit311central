/**
 * Board pack data quality — sanitise text and detect invalid display content
 * before PPTX/PDF generation. Prefer fallbacks over corrupted symbols.
 */

// Icon / dingbat glyphs that corrupt in PDF Helvetica (e.g. ▲▼ → %¼ %²).
// Do not include risk-trend codes ↑↓→ — those are mapped to words at render time.
const CORRUPT_CHAR_RE =
  /[\uFFFD\uFFFE\uFFFF\u0000-\u0008\u000B\u000C\u000E-\u001F]|[◆◇■□▪▫●○★☆►▶◀◄▲▼△▽⇒⇐➤➜]|%[¼½¾¹²³]|[?]{3,}|�/g;

const PLACEHOLDER_RE =
  /\b(TODO|TBD|PLACEHOLDER|LOREM IPSUM|XXX|FIXME|\[icon\]|\{icon\})\b/gi;

export function sanitizeAbhiBoardText(
  value: string | null | undefined,
  fallback = "",
): string {
  if (value == null) return fallback;
  let text = String(value)
    .normalize("NFC")
    .replace(/\u00A0/g, " ")
    .replace(CORRUPT_CHAR_RE, "")
    .replace(PLACEHOLDER_RE, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return fallback;
  // Strip leftover leading decorative bullets that are not ASCII
  text = text.replace(/^[^\w£$€%+\-/([]+\s*/, "");
  return text || fallback;
}

export function hasCorruptAbhiBoardText(value: string | null | undefined): boolean {
  if (value == null || value === "") return false;
  const raw = String(value);
  if (CORRUPT_CHAR_RE.test(raw)) return true;
  if (PLACEHOLDER_RE.test(raw)) return true;
  // Replacement character or mojibake markers
  if (raw.includes("�") || /Ã.|Â.|â€/.test(raw)) return true;
  return false;
}

export type AbhiBoardValidationIssue = {
  path: string;
  reason: string;
  original?: string;
};

export function validateAndSanitizeAbhiBoardPackData<T extends Record<string, unknown>>(
  data: T,
): { data: T; issues: AbhiBoardValidationIssue[] } {
  const issues: AbhiBoardValidationIssue[] = [];

  function walk(node: unknown, path: string): unknown {
    if (typeof node === "string") {
      if (hasCorruptAbhiBoardText(node)) {
        issues.push({ path, reason: "corrupt_or_placeholder_text", original: node });
      }
      const cleaned = sanitizeAbhiBoardText(node, "");
      if (!cleaned && node.trim()) {
        issues.push({ path, reason: "empty_after_sanitise", original: node });
        return "—";
      }
      return cleaned || node;
    }
    if (Array.isArray(node)) {
      return node.map((item, index) => walk(item, `${path}[${index}]`));
    }
    if (node && typeof node === "object") {
      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        out[key] = walk(value, path ? `${path}.${key}` : key);
      }
      return out;
    }
    if (node == null) {
      issues.push({ path, reason: "missing_value" });
      return node;
    }
    return node;
  }

  return { data: walk(data, "") as T, issues };
}
