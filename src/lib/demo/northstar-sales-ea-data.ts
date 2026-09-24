/**
 * Northstar Demo — Sales Management EA data from demo fixtures (no Supabase required).
 */

import "server-only";

import type { SalesQuote } from "@/lib/accounting/types";
import type { CrmLead } from "@/lib/crm-data";
import {
  getNorthstarCrmLeads,
  getNorthstarDiscoveryMeetings,
  getNorthstarPartners,
} from "@/lib/demo/module-fixtures";
import { getNorthstarSalesQuotes } from "@/lib/demo/northstar-sales-quotes-fixtures";
import { buildNorthstarDemoUsers } from "@/lib/demo/northstar-users-data";
import {
  buildForecastSummary,
  buildPerformanceSummary,
  buildPipelineBySalesperson,
  type SalesTargetRecord,
} from "@/lib/sales-management-service";
import { buildSalesDashboardMetrics, formatSalesMoney, isOpenPipelineLead } from "@/lib/sales-management-insights";
import type { NorthstarModuleQueryResult } from "@/lib/demo/executive-intelligence";

const DEMO_SALES_PEOPLE = [
  { userId: "demo-user-sales-1", displayName: "Alex Morgan" },
  { userId: "demo-user-sales-2", displayName: "Priya Shah" },
  { userId: "demo-user-sales-3", displayName: "Chris Okafor" },
] as const;

function displayNameForUserId(userId: string | null | undefined): string {
  if (!userId) return "Unassigned";
  return DEMO_SALES_PEOPLE.find((p) => p.userId === userId)?.displayName ?? "Unknown";
}

function assignLeadOwners(leads: CrmLead[]): CrmLead[] {
  return leads.map((lead, index) => ({
    ...lead,
    ownerUserId: lead.ownerUserId ?? DEMO_SALES_PEOPLE[index % DEMO_SALES_PEOPLE.length].userId,
  }));
}

function buildDemoSalesTargets(
  leads: CrmLead[],
  pipelineValue: number,
): SalesTargetRecord[] {
  const quarterStart = "2026-07-01";
  const quarterEnd = "2026-09-30";
  const teamTarget = Math.max(650_000, Math.round(pipelineValue * 1.35));

  return DEMO_SALES_PEOPLE.map((person, index) => {
    const owned = leads.filter((l) => l.ownerUserId === person.userId);
    const open = owned.filter((l) => isOpenPipelineLead(l.status));
    const won = owned.filter((l) => l.status === "Won");
    const actualValue =
      open.reduce((s, l) => s + (l.estimatedValue ?? 0), 0) +
      won.reduce((s, l) => s + (l.estimatedValue ?? 0), 0);
    const targetValue = Math.round(teamTarget / DEMO_SALES_PEOPLE.length);
    const progressPct =
      targetValue > 0 ? Math.min(150, Math.round((actualValue / targetValue) * 100)) : null;
    return {
      id: `demo-target-${index + 1}`,
      ownerUserId: person.userId,
      ownerName: person.displayName,
      teamId: "demo-sales-team-uk",
      teamName: "UK Commercial",
      periodType: "quarter" as const,
      periodStart: quarterStart,
      periodEnd: quarterEnd,
      targetValue,
      actualValue,
      progressPct,
      currency: "GBP" as const,
      notes: index === 2 ? "Recovery plan in place — pipeline weighted toward Q3 close." : null,
    };
  });
}

export type NorthstarSalesEaSnapshot = {
  leads: CrmLead[];
  quotes: SalesQuote[];
  metrics: ReturnType<typeof buildSalesDashboardMetrics>;
  targets: SalesTargetRecord[];
  forecast: ReturnType<typeof buildForecastSummary>;
  performance: ReturnType<typeof buildPerformanceSummary>;
  pipelineByPerson: ReturnType<typeof buildPipelineBySalesperson>;
  partners: ReturnType<typeof getNorthstarPartners>;
  people: typeof DEMO_SALES_PEOPLE;
};

export function buildNorthstarSalesEaSnapshot(): NorthstarSalesEaSnapshot {
  const leads = assignLeadOwners(getNorthstarCrmLeads());
  const quotes = getNorthstarSalesQuotes();
  const meetings = getNorthstarDiscoveryMeetings().map((m) => ({
    id: m.id,
    organization: m.organization,
    name: m.name,
    formattedWhen: m.formattedWhenGmt,
    status: "scheduled",
  }));

  const metrics = buildSalesDashboardMetrics({
    leads,
    quotes,
    meetings,
    displayNameForUserId,
  });

  const targets = buildDemoSalesTargets(leads, metrics.pipelineValue);
  const forecast = buildForecastSummary(leads, quotes);
  const performance = buildPerformanceSummary(leads, targets, displayNameForUserId);
  const pipelineByPerson = buildPipelineBySalesperson(leads, displayNameForUserId);

  return {
    leads,
    quotes,
    metrics,
    targets,
    forecast,
    performance,
    pipelineByPerson,
    partners: getNorthstarPartners(),
    people: DEMO_SALES_PEOPLE,
  };
}

function behindTargetPeople(targets: SalesTargetRecord[]) {
  return targets
    .filter((t) => (t.progressPct ?? 0) < 85)
    .map((t) => `${t.ownerName} (${t.progressPct ?? 0}% of ${formatSalesMoney(t.targetValue)} target)`);
}

function topOpportunities(leads: CrmLead[]) {
  return leads
    .filter((l) => l.status === "Hot" || l.status === "Warm")
    .sort((a, b) => (b.estimatedValue ?? 0) - (a.estimatedValue ?? 0))
    .slice(0, 5)
    .map((l) => `${l.companyName} — ${l.status} — ${formatSalesMoney(l.estimatedValue ?? 0)}`);
}

export function readNorthstarSalesManagementModule(
  question: string,
  focus?: string,
): NorthstarModuleQueryResult {
  const snap = buildNorthstarSalesEaSnapshot();
  const f = [focus, question].filter(Boolean).join(" ").toLowerCase();
  const { metrics, targets, forecast, performance, pipelineByPerson, leads, quotes, partners } = snap;

  if (/\bpartner/.test(f)) {
    return {
      asOf: new Date().toISOString(),
      module: "sales-management",
      headline: `${partners.length} channel partners supporting enterprise deals`,
      bullets: partners.slice(0, 5).map((p) => `${p.companyName} — ${p.city} — ${p.status}`),
      metrics: { partners: partners.length },
      navigationHint: "Sales Management → Partners",
    };
  }

  if (/\bcommission/.test(f)) {
    return {
      asOf: new Date().toISOString(),
      module: "sales-management",
      headline: "Commission rules active for won deals and accepted quotes",
      bullets: [
        "Standard rate 8% on won CRM opportunities",
        "Accelerated 10% on accepted quotes above £100k",
      ],
      metrics: { rulesActive: 2 },
      navigationHint: "Sales Management → Commissions",
    };
  }

  if (/\bquote/.test(f)) {
    const open = quotes.filter((q) => q.status === "sent" || q.status === "draft");
    return {
      asOf: new Date().toISOString(),
      module: "sales-management",
      headline: `${open.length} open sales quotes (${formatSalesMoney(metrics.quotesOpenValue)})`,
      bullets: open.slice(0, 4).map((q) => `${q.quoteNumber} — ${q.companyName} — ${formatSalesMoney(q.totalAmount)}`),
      metrics: { openQuotes: open.length, openQuoteValue: metrics.quotesOpenValue },
      navigationHint: "Sales Management → Sales Quotes",
    };
  }

  if (/\bforecast/.test(f) || /\bon track|behind target|hit target|quota/.test(f)) {
    const behind = behindTargetPeople(targets);
    const onTrack = targets.filter((t) => (t.progressPct ?? 0) >= 85).length;
    return {
      asOf: new Date().toISOString(),
      module: "sales-management",
      headline: `Q3 team target ${formatSalesMoney(targets.reduce((s, t) => s + t.targetValue, 0))} — ${onTrack}/${targets.length} reps on track`,
      bullets: [
        `Visible forecast ${formatSalesMoney(forecast.totalVisibleForecast)} (pipeline + won + accepted quotes)`,
        ...(behind.length
          ? [`Behind target: ${behind.join("; ")}`]
          : ["All reps at or above 85% of quarterly target"]),
        `Open pipeline ${formatSalesMoney(metrics.pipelineValue)} across ${metrics.openOpportunityCount} opportunities`,
      ],
      metrics: {
        teamTarget: targets.reduce((s, t) => s + t.targetValue, 0),
        visibleForecast: forecast.totalVisibleForecast,
        openPipeline: metrics.pipelineValue,
        repsBehind: behind.length,
      },
      navigationHint: "Sales Management → Targets & Forecast",
    };
  }

  if (/\bperform|best|top rep|sales team|who is behind|need attention/.test(f)) {
    const ranked = [...pipelineByPerson].sort((a, b) => b.value - a.value);
    const best = ranked[0];
    const behind = behindTargetPeople(targets);
    return {
      asOf: new Date().toISOString(),
      module: "sales-management",
      headline: best
        ? `${best.assignee} leads the team with ${formatSalesMoney(best.value)} open pipeline`
        : "Sales team performance snapshot",
      bullets: [
        ...ranked.slice(0, 3).map((r) => `${r.assignee}: ${r.count} deals · ${formatSalesMoney(r.value)} pipeline`),
        ...(behind.length ? [`Needs attention: ${behind.join("; ")}`] : []),
        `Win rate ${performance.conversionPct ?? metrics.winRatePct ?? "n/a"}% on closed opportunities`,
      ],
      metrics: {
        topRep: best?.assignee ?? "n/a",
        topPipeline: best?.value ?? 0,
        repsBehind: behind.length,
      },
      navigationHint: "Sales Management → Performance",
    };
  }

  if (/\bpipeline|opportunit|prospect|discovery|close|likely to close|miss target/.test(f)) {
    return {
      asOf: new Date().toISOString(),
      module: "sales-management",
      headline: `Open pipeline ${formatSalesMoney(metrics.pipelineValue)} — ${metrics.openOpportunityCount} active opportunities`,
      bullets: [
        ...topOpportunities(leads),
        `${leads.filter((l) => l.status === "Hot").length} hot opportunities need executive attention`,
        `Prospects: ${metrics.prospectCount} · Won YTD: ${metrics.wonCount}`,
      ],
      metrics: {
        pipelineValue: metrics.pipelineValue,
        openOpportunities: metrics.openOpportunityCount,
        hotCount: leads.filter((l) => l.status === "Hot").length,
      },
      navigationHint: "Sales Management → Pipeline",
    };
  }

  if (/\bhow are sales|sales doing|executive sales|sales update/.test(f)) {
    const behind = behindTargetPeople(targets);
    return {
      asOf: new Date().toISOString(),
      module: "sales-management",
      headline: `Sales ${metrics.pipelineValue >= 500_000 ? "on pace" : "needs recovery"} — pipeline ${formatSalesMoney(metrics.pipelineValue)}`,
      bullets: [
        `${metrics.openOpportunityCount} open opportunities · win rate ${metrics.winRatePct ?? performance.conversionPct ?? "n/a"}%`,
        `Q3 visible forecast ${formatSalesMoney(forecast.totalVisibleForecast)} vs team target ${formatSalesMoney(targets.reduce((s, t) => s + t.targetValue, 0))}`,
        ...(behind.length ? [`Reps behind target: ${behind.join("; ")}`] : ["Team broadly on track to quarterly target"]),
        `Top opportunities: ${topOpportunities(leads).slice(0, 2).join("; ")}`,
      ],
      metrics: {
        pipelineValue: metrics.pipelineValue,
        visibleForecast: forecast.totalVisibleForecast,
        winRatePct: metrics.winRatePct ?? 0,
        repsBehind: behind.length,
      },
      navigationHint: "Sales Management → Dashboard",
      records: { metrics, targets, forecast, performance },
    };
  }

  return {
    asOf: new Date().toISOString(),
    module: "sales-management",
    headline: `Sales Management — ${formatSalesMoney(metrics.pipelineValue)} open pipeline`,
    bullets: [
      `${metrics.openOpportunityCount} opportunities · ${metrics.prospectCount} prospects · ${metrics.wonCount} won`,
      `Quotes open: ${metrics.quotesOpenCount} (${formatSalesMoney(metrics.quotesOpenValue)})`,
      `Team: ${DEMO_SALES_PEOPLE.map((p) => p.displayName).join(", ")}`,
      `Users registered: ${buildNorthstarDemoUsers().length} (platform)`,
    ],
    metrics: {
      pipelineValue: metrics.pipelineValue,
      openOpportunities: metrics.openOpportunityCount,
      winRatePct: metrics.winRatePct ?? 0,
      quotesOpen: metrics.quotesOpenCount,
    },
    navigationHint: "Sales Management → Dashboard",
    records: { metrics, targets, forecast },
  };
}
