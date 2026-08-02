import { normalizeKpiRow } from "@/lib/dashboard-framework";
import type { DashboardSectionConfig, WorkspaceDashboardConfig } from "@/lib/dashboard-framework";
import type { AbhiTechRenewalItem } from "@/lib/abhi-tech-fake-data";
import { formatSoftwareMoney } from "@/lib/software-assets-data";

export type AbhiTechnologyEstateSummary = {
  devicesCount: number;
  telecomMonthlyGbp: number;
  spendTrendMomPct: number;
  spendTrendMomGbp: number;
  spendTrendLabels: string[];
  spendTrendValues: number[];
  upcomingRenewals: readonly AbhiTechRenewalItem[];
};

/**
 * Technology Management dashboard — live Software & SaaS register.
 * ABHI surfaces an expanded estate overview (devices, telecom, renewals).
 */
export function buildTechnologyManagementDashboardConfig(input: {
  softwareCount: number;
  activeCount: number;
  renewingSoonCount: number;
  annualSpend?: number;
  monthlySpend?: number;
  currency?: string;
  abhiEstate?: AbhiTechnologyEstateSummary;
}): WorkspaceDashboardConfig {
  const {
    softwareCount,
    activeCount,
    renewingSoonCount,
    annualSpend = 0,
    monthlySpend = 0,
    currency = "USD",
    abhiEstate,
  } = input;
  const isAbhi = Boolean(abhiEstate);
  const hasSpend = annualSpend > 0 || monthlySpend > 0;
  const annualLabel = hasSpend ? formatSoftwareMoney(annualSpend, currency) : "—";
  const monthlyLabel = hasSpend ? formatSoftwareMoney(monthlySpend, currency) : "—";
  const upcomingCount = abhiEstate?.upcomingRenewals.length ?? renewingSoonCount;
  const upcomingCostGbp =
    abhiEstate?.upcomingRenewals.reduce((sum, row) => sum + row.costGbp, 0) ?? 0;
  const totalMonthlyGbp = isAbhi
    ? Math.round(monthlySpend + (abhiEstate?.telecomMonthlyGbp ?? 0))
    : 0;
  const momPct = abhiEstate?.spendTrendMomPct ?? 0;
  const momLabel =
    momPct === 0
      ? "—"
      : `${momPct >= 0 ? "+" : "−"}${Math.abs(momPct).toFixed(1)}%`;
  const momTone = momPct > 0 ? "warning" : momPct < 0 ? "positive" : "neutral";

  const description = isAbhi
    ? "Executive overview of ABHI devices, software & SaaS, telecommunications, spend trends, and upcoming renewals."
    : "Live software and SaaS register. Additional technology registers (devices, telecom, infrastructure) will appear here when they ship.";

  const aiHeadline = isAbhi
    ? `${abhiEstate!.devicesCount} devices · ${softwareCount} software assets · £${totalMonthlyGbp.toLocaleString("en-GB")}/mo total tech spend`
    : softwareCount === 0
      ? "No software assets recorded yet."
      : `${softwareCount} software asset${softwareCount === 1 ? "" : "s"} in the live register.`;

  const aiSummary = isAbhi
    ? `${upcomingCount} renewal${upcomingCount === 1 ? "" : "s"} on the horizon (~£${upcomingCostGbp.toLocaleString("en-GB")}). Telecom run-rate is £${abhiEstate!.telecomMonthlyGbp}/mo. Tech spend moved ${momLabel} month-on-month.`
    : renewingSoonCount > 0
      ? `${renewingSoonCount} item${renewingSoonCount === 1 ? "" : "s"} need renewal attention soon. Open Software & SaaS to manage contracts and licences.`
      : hasSpend
        ? `Active estate spend is about ${annualLabel}/year (${monthlyLabel}/month, ${currency}). Open Software & SaaS to manage vendors and renewals.`
        : "Open Software & SaaS to add vendors, licences, and renewals. Other technology domains are not available in the sidebar until they are live.";

  const kpis = isAbhi
    ? normalizeKpiRow([
        {
          id: "devices",
          label: "Devices",
          value: String(abhiEstate!.devicesCount),
          delta: "Physical estate",
          tone: "positive",
          hint: "Laptops, mobiles, monitors",
        },
        {
          id: "software-licences",
          label: "Software assets",
          value: String(softwareCount),
          delta: hasSpend ? `${annualLabel}/yr` : `${activeCount} active`,
          tone: softwareCount > 0 ? "positive" : "neutral",
          hint: "Live Software & SaaS register",
        },
        {
          id: "telecom-spend",
          label: "Telecoms £/mo",
          value: `£${abhiEstate!.telecomMonthlyGbp}`,
          delta: "Connectivity & voice",
          tone: "neutral",
          hint: "Mobile, fibre, circuits",
        },
        {
          id: "spend-trend",
          label: "Spend trend MoM",
          value: momLabel,
          delta:
            abhiEstate!.spendTrendMomGbp >= 0
              ? `+£${Math.abs(abhiEstate!.spendTrendMomGbp)}`
              : `−£${Math.abs(abhiEstate!.spendTrendMomGbp)}`,
          tone: momTone,
          hint: "Software + telecom combined",
        },
      ])
    : normalizeKpiRow([
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
      ]);

  const sections: DashboardSectionConfig[] = [
    {
      id: "header",
      slot: "header",
      widgets: [
        {
          id: "tech-header",
          type: "header",
          workspaceName: "Technology Management",
          eyebrow: isAbhi ? "Technology estate" : "Software & SaaS",
          description,
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
          title: isAbhi ? "Technology estate" : "Software register",
          headline: aiHeadline,
          summary: aiSummary,
          nextUp: isAbhi ? "Review upcoming renewals" : "Open Software & SaaS",
          metrics: isAbhi
            ? [
                { label: "Devices", value: String(abhiEstate!.devicesCount) },
                { label: "Software assets", value: String(softwareCount) },
                { label: "Upcoming renewals", value: String(upcomingCount) },
                { label: "Total £/mo", value: `£${totalMonthlyGbp.toLocaleString("en-GB")}` },
              ]
            : [
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
          kpis,
        },
      ],
    },
  ];

  if (isAbhi && abhiEstate) {
    sections.push(
      {
        id: "analytics",
        slot: "analytics-queue",
        widgets: [
          {
            id: "tech-spend-trend",
            type: "analytics",
            title: "Technology spend trend",
            caption: "Combined software & telecom run-rate · last 6 months",
            series: [
              {
                id: "tech-spend",
                label: "Monthly spend",
                values: abhiEstate.spendTrendValues,
                labels: abhiEstate.spendTrendLabels,
                format: "currency",
                currency: "GBP",
                latestLabel: `£${totalMonthlyGbp.toLocaleString("en-GB")}`,
              },
            ],
            annotations: [
              {
                id: "mom",
                label: "MoM change",
                value: momLabel,
                tone: momTone,
                hint: `${abhiEstate.spendTrendMomGbp >= 0 ? "+" : "−"}£${Math.abs(abhiEstate.spendTrendMomGbp)} vs prior month`,
              },
              {
                id: "software",
                label: "Software £/mo",
                value: hasSpend ? monthlyLabel : "—",
                tone: "neutral",
                hint: "From live register",
              },
              {
                id: "telecom",
                label: "Telecom £/mo",
                value: `£${abhiEstate.telecomMonthlyGbp}`,
                tone: "neutral",
                hint: "Mobile, fibre, circuits",
              },
            ],
            emptyMessage: "No spend history available.",
          },
        ],
      },
      {
        id: "renewals-queue",
        slot: "analytics-queue",
        widgets: [
          {
            id: "tech-renewals",
            type: "work-queue",
            title: "Upcoming costs & renewals",
            subtitle: "Licences, contracts, and hardware refresh",
            items: abhiEstate.upcomingRenewals.map((row) => ({
              id: row.id,
              title: row.label,
              meta: `${row.category} · £${row.costGbp.toLocaleString("en-GB")}`,
              status: row.category,
              dueLabel: row.dueDate,
              priority:
                row.category === "Software"
                  ? "high"
                  : row.category === "Telecom"
                    ? "medium"
                    : "low",
            })),
          },
        ],
      },
    );
  }

  sections.push({
    id: "actions",
    slot: "quick-actions",
    widgets: [
      {
        id: "tech-actions",
        type: "quick-actions",
        title: "Actions",
        actions: isAbhi
          ? [
              {
                id: "open-software",
                label: "Software & SaaS",
                action: "open-software",
                icon: "plus",
              },
              {
                id: "open-devices",
                label: "Devices",
                action: "open-devices",
                icon: "users",
              },
              {
                id: "open-telecom",
                label: "Telecommunications",
                action: "open-telecom",
                icon: "file",
              },
            ]
          : [
              {
                id: "open-software",
                label: "Open Software & SaaS",
                action: "open-software",
                icon: "plus",
              },
            ],
      },
    ],
  });

  return {
    id: "technology-management-dashboard",
    workspaceId: "technology",
    version: 1,
    sections,
  };
}

/** @deprecated Static placeholder — use buildTechnologyManagementDashboardConfig */
export const technologyManagementDashboardConfig = buildTechnologyManagementDashboardConfig({
  softwareCount: 0,
  activeCount: 0,
  renewingSoonCount: 0,
});
