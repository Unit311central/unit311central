import { formatMoney } from "@/lib/accounting/chart-of-accounts";
import type { FinancialOverviewSnapshot } from "@/lib/accounting/types";
import type { ManagedClient } from "@/lib/client-management-data";
import { normalizeKpiRow } from "@/lib/dashboard-framework";
import type {
  DashboardKpiItem,
  WorkspaceDashboardConfig,
} from "@/lib/dashboard-framework";
import { countLiveProjects } from "@/lib/home-executive-dashboard";
import type { InternalProject } from "@/lib/projects-data";

function formatCompactMoney(amount: number, currency = "GBP") {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000 || abs >= 10_000) {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return formatMoney(amount, currency);
}

function monthDelta(
  series: Array<{ amount: number }> | undefined,
): { label: string; tone: DashboardKpiItem["tone"] } | null {
  if (!series || series.length < 2) return null;
  const current = series[series.length - 1]?.amount ?? 0;
  const prior = series[series.length - 2]?.amount ?? 0;
  const change = current - prior;
  if (Math.abs(change) < 0.005) {
    return { label: "Flat vs prior month", tone: "neutral" };
  }
  const sign = change > 0 ? "+" : "−";
  return {
    label: `${sign}${formatCompactMoney(Math.abs(change))} vs prior month`,
    tone: change > 0 ? "positive" : "warning",
  };
}

function revenuePctDelta(
  series: Array<{ amount: number }> | undefined,
): { label: string; tone: DashboardKpiItem["tone"] } | null {
  if (!series || series.length < 2) return null;
  const current = series[series.length - 1]?.amount ?? 0;
  const prior = series[series.length - 2]?.amount ?? 0;
  if (prior === 0) {
    if (current === 0) return { label: "No prior-month revenue", tone: "neutral" };
    return { label: "New vs prior month", tone: "positive" };
  }
  const pct = ((current - prior) / Math.abs(prior)) * 100;
  const sign = pct >= 0 ? "+" : "−";
  return {
    label: `${sign}${Math.abs(pct).toFixed(1)}% vs prior month`,
    tone: pct >= 0 ? "positive" : "warning",
  };
}

export function countProjectsAtRisk(projects: InternalProject[], now = Date.now()) {
  return projects.filter((project) => {
    if (project.phase !== "live") return false;
    if (project.notes?.toLowerCase().includes("risk")) return true;
    if (!project.endDate) return project.progressPct < 35;
    const days = (new Date(`${project.endDate}T12:00:00`).getTime() - now) / 86_400_000;
    return days <= 14 && project.progressPct < 70;
  }).length;
}

/** Live KPI values for the Executive Home row (same SSOT as Command Centre). */
export function buildExecutiveHomeLiveKpis(input: {
  financials: FinancialOverviewSnapshot | null;
  projects: InternalProject[];
  clients: ManagedClient[];
}): [
  DashboardKpiItem,
  DashboardKpiItem,
  DashboardKpiItem,
  DashboardKpiItem,
] {
  const currency = "GBP";
  const revenueYtd = input.financials?.revenueYtd ?? 0;
  const cash = input.financials?.cashPosition ?? 0;
  const openProjects = countLiveProjects(input.projects);
  const atRisk = countProjectsAtRisk(input.projects);
  const activeClients = input.clients.filter((client) => client.accountStatus === "Active").length;
  const onboarding = input.clients.filter((client) =>
    ["Client Created", "Workspace Provisioned", "Onboarding"].includes(client.accountStatus),
  ).length;

  const revenueDelta = revenuePctDelta(input.financials?.charts.monthlyRevenue);
  const cashDelta = monthDelta(input.financials?.charts.cashPosition);

  return normalizeKpiRow([
    {
      id: "revenue",
      label: "Revenue",
      value: formatCompactMoney(revenueYtd, currency),
      delta: revenueDelta?.label ?? "YTD from ledger",
      tone: revenueDelta?.tone ?? "neutral",
      hint: "YTD · general ledger",
    },
    {
      id: "cash",
      label: "Cash Available",
      value: formatCompactMoney(cash, currency),
      delta: cashDelta?.label ?? "Operating + treasury",
      tone: cashDelta?.tone ?? "neutral",
      hint: "Wise / treasury position",
    },
    {
      id: "projects",
      label: "Open Projects",
      value: String(openProjects),
      delta: atRisk > 0 ? `${atRisk} at risk` : "None at risk",
      tone: atRisk > 0 ? "warning" : "positive",
      hint: "Live projects",
    },
    {
      id: "clients",
      label: "Active Clients",
      value: String(activeClients),
      delta: onboarding > 0 ? `${onboarding} onboarding` : `${input.clients.length} total`,
      tone: "positive",
      hint: "Live commercial relationships",
    },
  ]);
}

export function withExecutiveHomeLiveKpis(
  config: WorkspaceDashboardConfig,
  kpis: ReturnType<typeof buildExecutiveHomeLiveKpis>,
): WorkspaceDashboardConfig {
  return {
    ...config,
    sections: config.sections.map((section) => {
      if (section.slot !== "kpi-row") return section;
      return {
        ...section,
        widgets: section.widgets.map((widget) =>
          widget.type === "kpi-row" ? { ...widget, kpis } : widget,
        ),
      };
    }),
  };
}

/**
 * Flagship Executive Home Dashboard — composed entirely from the
 * universal dashboard framework. No bespoke layout.
 * KPI values are placeholders until live data is merged via withExecutiveHomeLiveKpis.
 */
export const executiveHomeDashboardConfig: WorkspaceDashboardConfig = {
  id: "executive-home-dashboard",
  workspaceId: "home",
  version: 1,
  sections: [
    {
      id: "header",
      slot: "header",
      widgets: [
        {
          id: "home-header",
          type: "header",
          workspaceName: "Home",
          description:
            "Executive Dashboard — Your organisation at a glance. AI-powered insights, priorities and business performance across every workspace.",
        },
      ],
    },
    {
      id: "ai",
      slot: "ai-summary",
      widgets: [
        {
          id: "home-ai",
          type: "ai-summary",
          title: "AI Executive Summary",
          headline: "Good morning Philip.",
          summary:
            "Sales pipeline increased 8% this week. Cash position remains healthy. Two contracts require approval. One project is behind schedule. Technology renewals need attention next Tuesday. Three invoices are overdue.",
          nextUp: "Review the ABC Medical proposal before 2pm.",
          metrics: [
            { label: "Needs attention", value: "6" },
            { label: "Changed this week", value: "14" },
            { label: "Decisions due", value: "3" },
          ],
        },
      ],
    },
    {
      id: "kpis",
      slot: "kpi-row",
      widgets: [
        {
          id: "home-kpis",
          type: "kpi-row",
          kpis: normalizeKpiRow([
            {
              id: "revenue",
              label: "Revenue",
              value: "—",
              hint: "YTD · general ledger",
            },
            {
              id: "cash",
              label: "Cash Available",
              value: "—",
              hint: "Wise / treasury position",
            },
            {
              id: "projects",
              label: "Open Projects",
              value: "—",
              hint: "Live projects",
            },
            {
              id: "clients",
              label: "Active Clients",
              value: "—",
              hint: "Live commercial relationships",
            },
          ]),
        },
      ],
    },
    {
      id: "alerts-activity",
      slot: "alerts-activity",
      widgets: [
        {
          id: "home-alerts",
          type: "alerts",
          title: "Business Alerts",
          items: [
            {
              id: "ha1",
              title: "Two contracts awaiting signature",
              detail: "ABC Medical MSA and Harbor Logistics SOW are past internal review.",
              severity: "critical",
              timeLabel: "Due today",
            },
            {
              id: "ha2",
              title: "Project behind schedule — Coastal Survey",
              detail: "Delivery slipped 9 days. Client notified; recovery plan required.",
              severity: "warning",
              timeLabel: "Updated 1h ago",
            },
            {
              id: "ha3",
              title: "Three invoices overdue beyond 45 days",
              detail: "£184k outstanding. Finance recommends chase sequence today.",
              severity: "warning",
              timeLabel: "Finance",
            },
            {
              id: "ha4",
              title: "Technology renewals due Tuesday",
              detail: "Three SaaS and certificate renewals land Tuesday. Review before committing spend.",
              severity: "info",
              timeLabel: "Next week",
            },
          ],
        },
        {
          id: "home-activity",
          type: "recent-activity",
          title: "Recent Business Activity",
          items: [
            {
              id: "act1",
              title: "Pipeline stage change — Meridian Energy",
              meta: "Discovery → Proposal · £420k",
              timeLabel: "08:40",
              category: "Sales",
            },
            {
              id: "act2",
              title: "Payment received — Apex Mining",
              meta: "£32,500 cleared to operating account",
              timeLabel: "09:15",
              category: "Finance",
            },
            {
              id: "act3",
              title: "Board pack draft shared",
              meta: "Q3 pack uploaded for director review",
              timeLabel: "Yesterday",
              category: "Corporate",
            },
            {
              id: "act4",
              title: "New client record — Harbor Logistics",
              meta: "Created from inbound website enquiry",
              timeLabel: "Yesterday",
              category: "Clients",
            },
            {
              id: "act5",
              title: "Support ticket escalated — TK-1042",
              meta: "External portal login failure",
              timeLabel: "2h ago",
              category: "Support",
            },
          ],
        },
      ],
    },
    {
      id: "analytics-queue",
      slot: "analytics-queue",
      widgets: [
        {
          id: "home-analytics",
          type: "analytics",
          title: "Business Performance",
          caption: "Revenue vs operating spend · last 8 weeks",
          series: [
            { id: "revenue", label: "Revenue", values: [410, 390, 450, 420, 480, 460, 510, 495] },
            { id: "spend", label: "Operating spend", values: [280, 275, 290, 285, 300, 295, 310, 287] },
          ],
        },
        {
          id: "home-queue",
          type: "work-queue",
          title: "Tasks Requiring Attention",
          items: [
            {
              id: "tq1",
              title: "Approve ABC Medical proposal",
              meta: "Decision · Commercial",
              status: "Approval",
              dueLabel: "Before 2pm",
              priority: "high",
            },
            {
              id: "tq2",
              title: "Sign Harbor Logistics SOW",
              meta: "Contract · Legal review complete",
              status: "Approval",
              dueLabel: "Today",
              priority: "high",
            },
            {
              id: "tq3",
              title: "Review Coastal Survey recovery plan",
              meta: "Project · Delivery risk",
              status: "Review",
              dueLabel: "Today",
              priority: "high",
            },
            {
              id: "tq4",
              title: "Authorise overdue invoice chase sequence",
              meta: "Finance · £184k AR",
              status: "Decision",
              dueLabel: "Tomorrow",
              priority: "medium",
            },
            {
              id: "tq5",
              title: "Confirm Tuesday technology renewals",
              meta: "Technology · 3 renewals due",
              status: "Deadline",
              dueLabel: "Monday",
              priority: "medium",
            },
          ],
        },
      ],
    },
  ],
};
