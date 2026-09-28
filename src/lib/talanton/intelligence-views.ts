import type { InternalOperationsView } from "@/lib/internal-operations-data";

/** Talanton Intelligence views with dedicated workspace UIs (not generic IntelligenceCentral). */
export const TALANTON_DEDICATED_INTELLIGENCE_VIEWS = [
  "portfolio-intelligence-briefing",
  "portfolio-intelligence-company",
  "impact-intelligence-dashboard",
  "impact-intelligence-company",
  "opportunity-intelligence",
] as const satisfies readonly InternalOperationsView[];

export type TalantonDedicatedIntelligenceView = (typeof TALANTON_DEDICATED_INTELLIGENCE_VIEWS)[number];

export function isTalantonDedicatedIntelligenceView(
  view: string | null | undefined,
): view is TalantonDedicatedIntelligenceView {
  return (TALANTON_DEDICATED_INTELLIGENCE_VIEWS as readonly string[]).includes(String(view ?? ""));
}
