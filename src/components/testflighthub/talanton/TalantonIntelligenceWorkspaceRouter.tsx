"use client";

import type { InternalOperationsView } from "@/lib/internal-operations-data";
import {
  isTalantonDedicatedIntelligenceView,
  type TalantonDedicatedIntelligenceView,
} from "@/lib/talanton/intelligence-views";

import CompanyImpactWorkspace from "./CompanyImpactWorkspace";
import CompanyIntelligenceWorkspace from "./CompanyIntelligenceWorkspace";
import ImpactIntelligenceDashboardWorkspace from "./ImpactIntelligenceDashboardWorkspace";
import OpportunityIntelligenceWorkspace from "./OpportunityIntelligenceWorkspace";
import PortfolioIntelligenceBriefingWorkspace from "./PortfolioIntelligenceBriefingWorkspace";

export { isTalantonDedicatedIntelligenceView };

type Props = {
  view: TalantonDedicatedIntelligenceView;
};

export default function TalantonIntelligenceWorkspaceRouter({ view }: Props) {
  switch (view) {
    case "portfolio-intelligence-briefing":
      return <PortfolioIntelligenceBriefingWorkspace />;
    case "portfolio-intelligence-company":
      return <CompanyIntelligenceWorkspace />;
    case "impact-intelligence-dashboard":
      return <ImpactIntelligenceDashboardWorkspace />;
    case "impact-intelligence-company":
      return <CompanyImpactWorkspace />;
    case "opportunity-intelligence":
      return <OpportunityIntelligenceWorkspace />;
    default:
      return null;
  }
}

export function resolveTalantonDedicatedIntelligenceView(
  view: InternalOperationsView,
): TalantonDedicatedIntelligenceView | null {
  return isTalantonDedicatedIntelligenceView(view) ? view : null;
}
