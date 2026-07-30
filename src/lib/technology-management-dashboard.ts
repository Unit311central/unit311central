import { normalizeKpiRow } from "@/lib/dashboard-framework";
import type { WorkspaceDashboardConfig } from "@/lib/dashboard-framework";
import { formatSoftwareMoney } from "@/lib/software-assets-data";

/**
 * Technology Management dashboard — live Software & SaaS register only.
 * Other technology registers are not in the product surface yet.
 */
export function buildTechnologyManagementDashboardConfig(input: {
  softwareCount: number;
  activeCount: number;
  renewingSoonCount: number;
  annualSpend?: number;
  monthlySpend?: number;
  currency?: string;
}): WorkspaceDashboardConfig {
  const {
    softwareCount,
    activeCount,
    renewingSoonCount,
    annualSpend = 0,
    monthlySpend = 0,
    currency = "USD",
  } = input;
  const hasSpend = annualSpend > 0 || monthlySpend > 0;
  const annualLabel = hasSpend ? formatSoftwareMoney(annualSpend, currency) : "—";
  const monthlyLabel = hasSpend ? formatSoftwareMoney(monthlySpend, currency) : "—";

  return {
    id: "technology-management-dashboard",
    workspaceId: "technology",
    version: 1,
    sections: [
      {
        id: "header",
        slot: "header",
        widgets: [
          {
            id: "tech-header",
            type: "header",
            workspaceName: "Technology Management",
            eyebrow: "Software & SaaS",
            description:
              "Live software and SaaS register. Additional technology registers (devices, telecom, infrastructure) will appear here when they ship.",
          },
        ],
      },
      {
        id: "ai",
        slot: "ai-summary",
        widgets: [
          {
            id: "tech-ai",
            type: "ai-summary",
            title: "Software register",
            headline:
              softwareCount === 0
                ? "No software assets recorded yet."
                : `${softwareCount} software asset${softwareCount === 1 ? "" : "s"} in the live register.`,
            summary:
              renewingSoonCount > 0
                ? `${renewingSoonCount} item${renewingSoonCount === 1 ? "" : "s"} need renewal attention soon. Open Software & SaaS to manage contracts and licences.`
                : hasSpend
                  ? `Active estate spend is about ${annualLabel}/year (${monthlyLabel}/month, ${currency}). Open Software & SaaS to manage vendors and renewals.`
                  : "Open Software & SaaS to add vendors, licences, and renewals. Other technology domains are not available in the sidebar until they are live.",
            nextUp: "Open Software & SaaS",
            metrics: [
              { label: "Software assets", value: String(softwareCount) },
              { label: "Active", value: String(activeCount) },
              { label: "Renewing soon", value: String(renewingSoonCount) },
              { label: `Annual spend (${currency})`, value: annualLabel },
            ],
          },
        ],
      },
      {
        id: "kpis",
        slot: "kpi-row",
        widgets: [
          {
            id: "tech-kpis",
            type: "kpi-row",
            kpis: normalizeKpiRow([
              {
                id: "software-licences",
                label: "Software assets",
                value: String(softwareCount),
                delta: `${activeCount} active`,
                tone: softwareCount > 0 ? "positive" : "neutral",
                hint: "Live Software & SaaS register",
              },
              {
                id: "annual-spend",
                label: `Annual spend (${currency})`,
                value: annualLabel,
                delta: hasSpend ? `${monthlyLabel}/mo` : "No spend logged",
                tone: "neutral",
                hint: "From live register costs",
              },
              {
                id: "renewals",
                label: "Renewals soon",
                value: String(renewingSoonCount),
                delta: renewingSoonCount > 0 ? "Needs review" : "None flagged",
                tone: renewingSoonCount > 0 ? "warning" : "positive",
                hint: "From live register dates",
              },
              {
                id: "estate-scope",
                label: "Live registers",
                value: "1",
                delta: "Software & SaaS",
                tone: "neutral",
                hint: "Devices/telecom/infra not shipped yet",
              },
            ]),
          },
        ],
      },
      {
        id: "actions",
        slot: "quick-actions",
        widgets: [
          {
            id: "tech-actions",
            type: "quick-actions",
            title: "Actions",
            actions: [
              {
                id: "open-software",
                label: "Open Software & SaaS",
                action: "open-software",
                icon: "plus",
              },
            ],
          },
        ],
      },
    ],
  };
}

/** @deprecated Static placeholder — use buildTechnologyManagementDashboardConfig */
export const technologyManagementDashboardConfig = buildTechnologyManagementDashboardConfig({
  softwareCount: 0,
  activeCount: 0,
  renewingSoonCount: 0,
});
