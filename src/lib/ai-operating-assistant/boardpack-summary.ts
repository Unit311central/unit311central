/** Board pack tool summaries historically used `title` — normalize for UI + runtime cards. */
export function resolveBoardPackSummaryName(
  summary: Record<string, unknown> | null | undefined,
): string | null {
  if (!summary) return null;
  if (typeof summary.packName === "string" && summary.packName.trim()) {
    return summary.packName.trim();
  }
  if (typeof summary.title === "string" && summary.title.trim()) {
    return summary.title.trim();
  }
  return null;
}
