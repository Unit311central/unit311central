import type { SalesQuote } from "@/lib/accounting/types";
import type { CrmLead, LeadStatus } from "@/lib/crm-data";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import { isBrowserCorpCentreSurface } from "@/lib/corpcentre-surface";

export type SalesManagementCrmVariant = "default" | "prospects" | "opportunities";

export type SalesReportingCurrency = "AUD" | "GBP" | "USD";

export function salesReportingCurrency(): SalesReportingCurrency {
  try {
    if (typeof window !== "undefined" && isBrowserOnwardAirSurface()) return "USD";
    if (typeof window !== "undefined" && isBrowserCorpCentreSurface()) return "AUD";
  } catch {
    // SSR / non-browser
  }
  return "GBP";
}

export function formatSalesMoney(amount: number, currency = salesReportingCurrency()): string {
  const locale = currency === "AUD" ? "en-AU" : "en-GB";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

const OPEN_PIPELINE_STATUSES = new Set<LeadStatus>(["Cold", "Warm", "Hot"]);
const PROSPECT_STATUSES = new Set<LeadStatus>(["Cold", "Warm"]);
const OPPORTUNITY_STATUSES = new Set<LeadStatus>(["Warm", "Hot", "Won", "Active Customer"]);

export function isOpenPipelineLead(status: LeadStatus): boolean {
  return OPEN_PIPELINE_STATUSES.has(status);
}

export function isProspectLead(status: LeadStatus): boolean {
  return PROSPECT_STATUSES.has(status);
}

export function isOpportunityLead(status: LeadStatus): boolean {
  return OPPORTUNITY_STATUSES.has(status);
}

export function filterLeadsBySalesSegment(
  leads: CrmLead[],
  segment: "prospects" | "opportunities" | "pipeline" | "all",
): CrmLead[] {
  switch (segment) {
    case "prospects":
      return leads.filter((lead) => isProspectLead(lead.status));
    case "opportunities":
      return leads.filter((lead) => isOpportunityLead(lead.status));
    case "pipeline":
      return leads.filter((lead) => isOpenPipelineLead(lead.status));
    default:
      return leads;
  }
}

export type SalesDashboardMeetingSummary = {
  id: string;
  organization: string;
  name: string;
  formattedWhen: string;
  status: string;
};

export type SalesDashboardMetrics = {
  currency: SalesReportingCurrency;
  pipelineValue: number;
  openOpportunityCount: number;
  prospectCount: number;
  wonCount: number;
  lostCount: number;
  winRatePct: number | null;
  quotesOpenCount: number;
  quotesOpenValue: number;
  quotesAcceptedCount: number;
  upcomingMeetingsCount: number;
  upcomingActionsCount: number;
  byStatus: Array<{ status: LeadStatus; count: number; value: number }>;
  pipelineByAssignee: Array<{ assignee: string; count: number; value: number }>;
  leadsCreatedByMonth: Array<{ month: string; count: number }>;
  upcomingActions: Array<{
    id: string;
    companyName: string;
    nextAction: string;
    nextActionDate: string | null;
    status: LeadStatus;
  }>;
  upcomingMeetings: SalesDashboardMeetingSummary[];
};

function monthKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

function isUpcomingDate(iso: string | null | undefined, withinDays = 14): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + withinDays);
  return date >= now && date <= end;
}

export function buildSalesDashboardMetrics(input: {
  leads: CrmLead[];
  quotes?: SalesQuote[];
  meetings?: SalesDashboardMeetingSummary[];
}): SalesDashboardMetrics {
  const { leads, quotes = [], meetings = [] } = input;
  const currency = salesReportingCurrency();
  const openLeads = leads.filter((lead) => isOpenPipelineLead(lead.status));
  const pipelineValue = openLeads.reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0);
  const wonCount = leads.filter((lead) => lead.status === "Won").length;
  const lostCount = leads.filter((lead) => lead.status === "Lost").length;
  const closedCount = wonCount + lostCount;
  const winRatePct = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : null;

  const openQuotes = quotes.filter((quote) => quote.status === "draft" || quote.status === "sent");
  const acceptedQuotes = quotes.filter((quote) => quote.status === "accepted");

  const byStatus = (["Cold", "Warm", "Hot", "Won", "Active Customer", "Lost"] as LeadStatus[]).map(
    (status) => ({
      status,
      count: leads.filter((lead) => lead.status === status).length,
      value: leads
        .filter((lead) => lead.status === status)
        .reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0),
    }),
  );

  const assigneeMap = new Map<string, { count: number; value: number }>();
  for (const lead of openLeads) {
    const assignee = "Unassigned";
    const current = assigneeMap.get(assignee) ?? { count: 0, value: 0 };
    current.count += 1;
    current.value += lead.estimatedValue ?? 0;
    assigneeMap.set(assignee, current);
  }

  const monthMap = new Map<string, number>();
  for (const lead of leads) {
    const key = monthKey(lead.createdAt);
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  }

  const upcomingActions = leads
    .filter((lead) => isOpenPipelineLead(lead.status) && isUpcomingDate(lead.nextActionDate))
    .sort((a, b) => String(a.nextActionDate).localeCompare(String(b.nextActionDate)))
    .slice(0, 8)
    .map((lead) => ({
      id: lead.id,
      companyName: lead.companyName,
      nextAction: lead.nextAction || "Follow up",
      nextActionDate: lead.nextActionDate,
      status: lead.status,
    }));

  const upcomingMeetings = meetings
    .filter((meeting) => meeting.status !== "cancelled" && meeting.status !== "completed")
    .slice(0, 6);

  return {
    currency,
    pipelineValue,
    openOpportunityCount: openLeads.length,
    prospectCount: leads.filter((lead) => isProspectLead(lead.status)).length,
    wonCount,
    lostCount,
    winRatePct,
    quotesOpenCount: openQuotes.length,
    quotesOpenValue: openQuotes.reduce((sum, quote) => sum + quote.totalAmount, 0),
    quotesAcceptedCount: acceptedQuotes.length,
    upcomingMeetingsCount: upcomingMeetings.length,
    upcomingActionsCount: upcomingActions.length,
    byStatus,
    pipelineByAssignee: [...assigneeMap.entries()].map(([assignee, stats]) => ({
      assignee,
      ...stats,
    })),
    leadsCreatedByMonth: [...monthMap.entries()]
      .map(([month, count]) => ({ month, count }))
      .slice(-6),
    upcomingActions,
    upcomingMeetings,
  };
}
