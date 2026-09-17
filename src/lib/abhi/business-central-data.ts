import type { OaBcDashboardSummary } from "@/lib/onwardair/business-central-data";
import {
  ABHI_ACTIVE_MEMBER_COUNT,
  ABHI_ONBOARDING_MEMBER_COUNT,
} from "@/lib/abhi-surface";
import { ABHI_REVENUE_YTD_GBP } from "@/lib/abhi-financials";

/** ABHI Business Central dashboard — sterling amounts (field names retain legacy *Usd suffix). */
export function getAbhiBcDashboardSummary(): OaBcDashboardSummary {
  const pipelineByStage = [
    { stage: "Cold" as const, count: 14, valueUsd: 420_000 },
    { stage: "Warm" as const, count: 11, valueUsd: 380_000 },
    { stage: "Hot" as const, count: 6, valueUsd: 290_000 },
  ];
  const pipelineValue = pipelineByStage.reduce((sum, row) => sum + row.valueUsd, 0);

  return {
    clientsCount: ABHI_ACTIVE_MEMBER_COUNT + ABHI_ONBOARDING_MEMBER_COUNT,
    activeClients: ABHI_ACTIVE_MEMBER_COUNT,
    arrUsd: Math.round(ABHI_REVENUE_YTD_GBP * 0.85),
    pipelineValueUsd: pipelineValue,
    pipelineByStage,
    discoveryCount: 9,
    onboardingCount: ABHI_ONBOARDING_MEMBER_COUNT,
    partnersCount: 7,
    partnerRegions: ["UK", "EU", "North America"],
    commissionPipelineUsd: 62_500,
  };
}
