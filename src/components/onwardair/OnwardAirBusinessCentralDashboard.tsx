"use client";

import BusinessCentralDashboardView from "@/components/business-central/BusinessCentralDashboardView";
import { buildBusinessCentralDashboardEyebrow } from "@/lib/business-central-dashboard-variant";
import { getOaBcDashboardSummary } from "@/lib/onwardair/business-central-data";

export default function OnwardAirBusinessCentralDashboard() {
  const summary = getOaBcDashboardSummary();

  return (
    <BusinessCentralDashboardView
      eyebrow={buildBusinessCentralDashboardEyebrow({ variant: "onwardair" })}
      description="Commercial snapshot across clients, pipeline, discovery, onboarding, partners, and US grant programmes — all figures in USD."
      summary={summary}
      grantsTile={{ value: "US schemes", hint: "SBIR / STTR / DoD / NASA / FAA" }}
    />
  );
}
