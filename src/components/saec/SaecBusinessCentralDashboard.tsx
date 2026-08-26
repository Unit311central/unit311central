"use client";

import BusinessCentralDashboardView from "@/components/business-central/BusinessCentralDashboardView";
import {
  getSaecBcDashboardSummary,
} from "@/lib/saec/business-central-data";
import { SAEC_COMPANY_NAME, SAEC_REPORTING_CURRENCY } from "@/lib/saec-surface";

export default function SaecBusinessCentralDashboard() {
  const summary = getSaecBcDashboardSummary();

  return (
    <BusinessCentralDashboardView
      eyebrow={`${SAEC_COMPANY_NAME} · Commercial operations`}
      description={`Commercial snapshot across clients, pipeline, discovery, onboarding, and partners.`}
      summary={summary}
      grantsTile={{ value: "—", hint: "No grant programmes configured" }}
      currency={SAEC_REPORTING_CURRENCY}
    />
  );
}
