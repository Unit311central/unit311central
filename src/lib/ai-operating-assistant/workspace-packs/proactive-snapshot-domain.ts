/**
 * Default proactive insight domain resolution — workspace packs may override via proactiveInsightMapping.
 */

import type { BusinessSnapshotDomain } from "@/lib/ai-operating-assistant/business-snapshot-service";

export function defaultResolveSnapshotDomain(
  raw: string | null,
): BusinessSnapshotDomain {
  const value = (raw || "all").toLowerCase();
  if (
    value === "overview" ||
    value === "clients" ||
    value === "projects" ||
    value === "finance" ||
    value === "hr" ||
    value === "crm" ||
    value === "assets" ||
    value === "all"
  ) {
    return value;
  }
  if (
    /\b(assets?\s+section|physical\s+assets?|asset\s+register|fleet|drones?|equipment\s+register|look\s+in\s+(the\s+)?assets?)\b/.test(
      value,
    ) ||
    (/\bassets?\b/.test(value) &&
      !/\b(cash|bank|wise|financial|finance|balance sheet)\b/.test(value))
  ) {
    return "assets";
  }
  if (
    /finance|financial|cash|bank|wise|treasury|balance|revenue|invoice|expense|p\s*&?\s*l|profit|burn|debtor|creditor/.test(
      value,
    )
  ) {
    return "finance";
  }
  if (/client|customer/.test(value)) return "clients";
  if (/project|delivery/.test(value)) return "projects";
  if (/\bportfolio\b/.test(value)) return "projects";
  if (/hr|employee|staff|people|leave/.test(value)) return "hr";
  if (/crm|lead|pipeline|sales/.test(value)) return "crm";
  if (/inventory|logistics|shipment/.test(value)) return "assets";
  if (/health|brief|overview|business|company|status/.test(value)) return "overview";
  return "all";
}
