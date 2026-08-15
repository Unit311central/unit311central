import type {
  IntelligenceBriefing,
  IntelligenceRecord,
  IntelligenceScoreBand,
  IntelligenceSeverity,
  IntelligenceWorkspaceSlug,
} from "@/lib/intelligence/types";

export function severityFromCertCategory(category: string): IntelligenceSeverity {
  switch (category) {
    case "In Certification":
      return "high";
    case "Certification Target":
      return "medium";
    case "Wound Down / IP Acquired":
      return "low";
    default:
      return "info";
  }
}

export function bandFromPriority(priority: string): IntelligenceScoreBand {
  switch (priority) {
    case "Critical":
      return "critical";
    case "High":
      return "elevated";
    case "Medium":
      return "watch";
    default:
      return "healthy";
  }
}

export function briefingFromSections(
  workspaceSlug: IntelligenceWorkspaceSlug,
  domainId: string,
  headline: string,
  sections: IntelligenceBriefing["sections"],
  options?: { posture?: IntelligenceScoreBand; postureReason?: string; recommendedActions?: string[] },
): IntelligenceBriefing {
  return {
    workspaceSlug,
    domainId,
    asOf: new Date().toISOString().slice(0, 10),
    headline,
    posture: options?.posture,
    postureReason: options?.postureReason,
    sections,
    recommendedActions: options?.recommendedActions,
  };
}

export function paginateRecords<T>(
  items: readonly T[],
  map: (item: T) => IntelligenceRecord,
  limit = 50,
  offset = 0,
): { records: IntelligenceRecord[]; total: number } {
  const total = items.length;
  const records = items.slice(offset, offset + limit).map(map);
  return { records, total };
}
