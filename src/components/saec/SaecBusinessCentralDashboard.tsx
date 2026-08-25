"use client";

import BusinessCentralDashboardView from "@/components/business-central/BusinessCentralDashboardView";
import { buildBusinessCentralDashboardEyebrow } from "@/lib/business-central-dashboard-variant";
import {
  getSaecBcDashboardSummary,
  getSaecReportingCurrencyLabel,
} from "@/lib/saec/business-central-data";
import { SAEC_REPORTING_CURRENCY } from "@/lib/saec-surface";

export default function SaecBusinessCentralDashboard() {
  const summary = getSaecBcDashboardSummary();
  const currencyLabel = getSaecReportingCurrencyLabel();

  return (
    <BusinessCentralDashboardView
      eyebrow={buildBusinessCentralDashboardEyebrow({
        variant: "workspace",
        workspaceSlug: "saec",
        workspaceName: "SAEC",
      })}
      description={`Commercial snapshot across clients, pipeline, discovery, onboarding, and partners — all figures in ${currencyLabel}.`}
      summary={summary}
      grantsTile={{ value: "—", hint: "No grant programmes configured" }}
      currency={SAEC_REPORTING_CURRENCY}
    />
  );
}
