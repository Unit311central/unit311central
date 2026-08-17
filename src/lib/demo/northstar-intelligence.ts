/**
 * Northstar Intelligence — computed briefings from financial, client, delivery, and market fixtures.
 * Numbers align with Financials, Clients, Support Desk, Engineering, and Board modules.
 */

import type { ManagedClient } from "@/lib/client-management-data";
import { getNorthstarInvoices } from "@/lib/demo/northstar-ap-ar-fixtures";
import {
  NORTHSTAR_CASH_GBP,
  NORTHSTAR_MONTHLY_OPEX,
  NORTHSTAR_MONTHLY_REVENUE,
  NORTHSTAR_NET_PROFIT_YTD,
  NORTHSTAR_REVENUE_YTD,
  northstarDemoAsAtLabel,
  northstarGrossMarginPct,
  northstarMonthlyRevenueForMonth,
  northstarReportingPlMonthLabel,
  northstarYtdPeriodLabel,
} from "@/lib/demo/northstar-financial-model";
import { getNorthstarClients } from "@/lib/demo/module-fixtures";
import type { IntelligenceRecord, IntelligenceSeverity } from "@/lib/intelligence/types";

export type NorthstarIntelPosture = "healthy" | "watch" | "elevated" | "critical";

export type NorthstarIntelAction = {
  id: string;
  title: string;
  rationale: string;
  owner: string;
  priority: "now" | "this-week" | "monitor";
};

export type NorthstarCompanyKpi = {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone?: "good" | "warn" | "risk";
};

export type NorthstarCompanyIntelligence = {
  asAt: string;
  posture: NorthstarIntelPosture;
  postureReason: string;
  kpis: NorthstarCompanyKpi[];
  marginHistory: Array<{ month: string; marginPct: number; note?: string }>;
  costDrivers: Array<{ label: string; amountGbp: number; detail: string }>;
  deliverySignals: Array<{ title: string; detail: string; severity: IntelligenceSeverity }>;
  priorityActions: NorthstarIntelAction[];
};

export type NorthstarClientIntelRow = {
  id: string;
  name: string;
  healthScore: number;
  healthBand: "healthy" | "watch" | "at-risk";
  contractType: string;
  arrGbp: number;
  renewalInDays: number | null;
  openSupportTickets: number;
  accountOwner: string;
  issues: string[];
  keepThemActions: string[];
  evidence: string[];
};

export type NorthstarClientIntelligence = {
  asAt: string;
  posture: NorthstarIntelPosture;
  postureReason: string;
  summary: {
    activeAccounts: number;
    atRisk: number;
    onboarding: number;
    renewalNext90Days: number;
    portfolioArrGbp: number;
  };
  rows: NorthstarClientIntelRow[];
  priorityActions: NorthstarIntelAction[];
};

export type NorthstarMarketSignal = {
  id: string;
  title: string;
  category: "competitive" | "regulatory" | "sector" | "macro";
  severity: IntelligenceSeverity;
  summary: string;
  implication: string;
  response: string;
  source: string;
};

export type NorthstarMarketIntelligence = {
  asAt: string;
  posture: NorthstarIntelPosture;
  postureReason: string;
  signals: NorthstarMarketSignal[];
  priorityActions: NorthstarIntelAction[];
};

function formatGbp(value: number, compact = false) {
  if (compact && Math.abs(value) >= 1_000_000) {
    return `£${(value / 1_000_000).toFixed(1)}m`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `£${Math.round(value / 1_000)}k`;
  }
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function healthBand(score: number): NorthstarClientIntelRow["healthBand"] {
  if (score >= 75) return "healthy";
  if (score >= 55) return "watch";
  return "at-risk";
}

function estimateArr(contractType: string, clientId: string): number {
  if (clientId === "nst-cli-sheffield") return 186_000;
  if (clientId === "nst-cli-peak") return 94_000;
  if (clientId === "nst-cli-bristol") return 72_000;
  if (contractType === "Statement of Work") return 85_000;
  return 48_000;
}

function buildSheffieldRow(): NorthstarClientIntelRow {
  const sheffieldInvoices = getNorthstarInvoices().filter((row) => row.clientName.includes("Sheffield"));
  const overdue = sheffieldInvoices.some((row) => row.status === "overdue");
  return {
    id: "nst-cli-sheffield",
    name: "Sheffield Precision Engineering",
    healthScore: 41,
    healthBand: "at-risk",
    contractType: "Subscription",
    arrGbp: 186_000,
    renewalInDays: 87,
    openSupportTickets: 8,
    accountOwner: "Marcus Reed",
    issues: [
      "Atlas Monitoring Platform go-live slipped 6 weeks — UAT not signed",
      "Firmware regression drove 8 open support tickets in 14 days",
      "Executive sponsor engagement dropped since July board pack",
      overdue ? "£38.5k invoice overdue — collections follow-up required" : "Invoice ageing elevated",
    ],
    keepThemActions: [
      "Book weekly exec QBR with Tom Bradley until Atlas UAT sign-off (board mandate)",
      "Assign dedicated CSM + engineering war room for Line 3 gateway heartbeat issue",
      "Offer milestone credit on Phase 2 only after UAT closure — not before",
      "Escalate Voltex PCB delay impact in writing — Sheffield sees this as delivery risk",
    ],
    evidence: [
      "Support Desk · MAG-SUP-080 (portal login) + Line 3 gateway tickets",
      "Engineering · Atlas programme 18% over budget",
      "Financials · AR ageing · Sheffield Precision",
      "Board · renewal risk flagged Q2 2026 minutes",
    ],
  };
}

function buildPeakRow(): NorthstarClientIntelRow {
  return {
    id: "nst-cli-peak",
    name: "Peak District Breweries",
    healthScore: 82,
    healthBand: "healthy",
    contractType: "Statement of Work",
    arrGbp: 94_000,
    renewalInDays: 214,
    openSupportTickets: 1,
    accountOwner: "Elena Hart",
    issues: ["Fermentation tank export request — low severity"],
    keepThemActions: [
      "Ship dashboard export before month-end — prevents support noise",
      "Pitch Phase 2 predictive maintenance add-on at September QBR",
    ],
    evidence: ["Support Desk · fermentation export ticket", "Clients · IoT monitoring live"],
  };
}

function buildBristolRow(): NorthstarClientIntelRow {
  return {
    id: "nst-cli-bristol",
    name: "Bristol Composites Ltd",
    healthScore: 68,
    healthBand: "watch",
    contractType: "Framework Agreement",
    arrGbp: 72_000,
    renewalInDays: null,
    openSupportTickets: 2,
    accountOwner: "James Okonkwo",
    issues: [
      "Onboarding — firmware QA backlog risks go-live (3-week validation queue)",
      "Security review for OPC-UA bridge not yet scheduled",
    ],
    keepThemActions: [
      "Pull Bristol into shared firmware validation slot — do not start net-new queue",
      "Schedule security review before edge install window (Sep 2026)",
    ],
    evidence: ["Engineering · firmware QA backlog", "Clients · onboarding status"],
  };
}

function buildGenericClientRow(client: ManagedClient): NorthstarClientIntelRow {
  const score =
    client.accountStatus === "Onboarding"
      ? 65
      : client.id.includes("harbor")
        ? 20
        : 74 + (client.activeProjects > 1 ? 4 : 0);
  return {
    id: client.id,
    name: client.companyName,
    healthScore: score,
    healthBand: healthBand(score),
    contractType: client.contractType,
    arrGbp: estimateArr(client.contractType, client.id),
    renewalInDays: client.accountStatus === "Active" ? 120 + (client.id.length % 90) : null,
    openSupportTickets: client.accountStatus === "Onboarding" ? 2 : score < 50 ? 5 : 0,
    accountOwner: "Customer Success",
    issues:
      score < 50
        ? ["Historical churn — integration failure documented in onboarding playbook"]
        : client.accountStatus === "Onboarding"
          ? ["Implementation in progress — monitor go-live dependencies"]
          : [],
    keepThemActions:
      score < 50
        ? ["Apply Harbor Forge post-mortem checklist on any enterprise onboarding"]
        : ["Maintain standard QBR cadence"],
    evidence: ["Clients module · account status"],
  };
}

export function buildNorthstarCompanyIntelligence(): NorthstarCompanyIntelligence {
  const julRevenue = northstarMonthlyRevenueForMonth("2026-07");
  const augRevenue = northstarMonthlyRevenueForMonth("2026-08");
  const julMargin = northstarGrossMarginPct(julRevenue);
  const augMargin = northstarGrossMarginPct(augRevenue);
  const momRevenuePct = Math.round(((augRevenue - julRevenue) / julRevenue) * 100);
  const opex = NORTHSTAR_MONTHLY_OPEX;
  const burnDelta = opex - 274_000;

  const marginHistory = [
    { month: "Jun 2025", marginPct: 51, note: "Voltex delays + Harbor Forge churn" },
    { month: "Dec 2025", marginPct: 56, note: "Four new logos; collections ahead" },
    { month: "Jul 2026", marginPct: julMargin },
    { month: "Aug 2026", marginPct: augMargin, note: "Target path to 58%" },
  ];

  const costDrivers = [
    {
      label: "Payroll",
      amountGbp: 118_000,
      detail: "25 FTE UK + Austin expansion — US run-rate +12% vs plan",
    },
    {
      label: "Cloud & edge hosting",
      amountGbp: 42_000,
      detail: "Atlas telemetry ingest up with Sheffield + Peak live sites",
    },
    {
      label: "Voltex component premiums",
      amountGbp: 28_000,
      detail: "Expedited PCB orders — +6 week lead time on edge controllers",
    },
    {
      label: "Professional services",
      amountGbp: 16_000,
      detail: "UAT support and integration rework on Atlas programme",
    },
  ];

  const deliverySignals = [
    {
      title: "Atlas programme 18% over budget",
      detail: "£142k spend vs £120k plan — Voltex rework and firmware validation queue",
      severity: "high" as const,
    },
    {
      title: "Voltex Automation lead time +6 weeks",
      detail: "Single-source edge controllers — Sheffield UAT and Bristol onboarding at risk",
      severity: "critical" as const,
    },
    {
      title: "Firmware QA backlog",
      detail: "3-week validation queue — blocks Sheffield sign-off and Bristol go-live",
      severity: "medium" as const,
    },
    {
      title: "Cash collections ahead of forecast",
      detail: "Two enterprise invoices cleared early; operating cash £1.9m",
      severity: "low" as const,
    },
  ];

  const priorityActions: NorthstarIntelAction[] = [
    {
      id: "co-1",
      title: "Approve Nordic Components dual-source RFQ this week",
      rationale: "Voltex +6 weeks is the root cause of Atlas slippage and Sheffield renewal risk.",
      owner: "Paul Fotheringham",
      priority: "now",
    },
    {
      id: "co-2",
      title: "Freeze discretionary hire in Austin until pipeline conversion improves",
      rationale: "US payroll run-rate is 12% above plan with lagging UK-style conversion.",
      owner: "Finance + HR",
      priority: "this-week",
    },
    {
      id: "co-3",
      title: "Present margin recovery bridge to board (51% → 58%)",
      rationale: "Jun 2025 compression still referenced in board pack — show Aug trajectory.",
      owner: "CFO",
      priority: "this-week",
    },
  ];

  return {
    asAt: northstarDemoAsAtLabel(),
    posture: "watch",
    postureReason:
      "Revenue and cash are strong, but Atlas delivery overruns and Voltex supply dependency are compressing margin recovery and putting Sheffield renewal at risk.",
    kpis: [
      {
        id: "rev",
        label: "Monthly revenue",
        value: formatGbp(NORTHSTAR_MONTHLY_REVENUE, true),
        hint: `${momRevenuePct >= 0 ? "+" : ""}${momRevenuePct}% MoM · ${northstarReportingPlMonthLabel()} closed`,
        tone: "good",
      },
      {
        id: "margin",
        label: "Gross margin",
        value: `${augMargin}%`,
        hint: `Target 58% · up from 51% (Jun 2025)`,
        tone: augMargin >= 56 ? "good" : "warn",
      },
      {
        id: "ytd",
        label: "Net profit YTD",
        value: formatGbp(NORTHSTAR_NET_PROFIT_YTD, true),
        hint: northstarYtdPeriodLabel(),
        tone: "good",
      },
      {
        id: "cash",
        label: "Cash",
        value: formatGbp(NORTHSTAR_CASH_GBP, true),
        hint: "Collections ahead of forecast",
        tone: "good",
      },
      {
        id: "opex",
        label: "Monthly opex",
        value: formatGbp(opex, true),
        hint: `${burnDelta >= 0 ? "+" : ""}${formatGbp(burnDelta)} vs Jul burn`,
        tone: burnDelta > 10_000 ? "warn" : "good",
      },
      {
        id: "rev-ytd",
        label: "Revenue YTD",
        value: formatGbp(NORTHSTAR_REVENUE_YTD, true),
        hint: northstarYtdPeriodLabel(),
        tone: "good",
      },
    ],
    marginHistory,
    costDrivers,
    deliverySignals,
    priorityActions,
  };
}

export function buildNorthstarClientIntelligence(
  clients: ManagedClient[] = [],
): NorthstarClientIntelligence {
  const sourceClients = clients.length > 0 ? clients : (getNorthstarClients() as ManagedClient[]);
  const featuredIds = new Set(["nst-cli-sheffield", "nst-cli-peak", "nst-cli-bristol"]);
  const featured = [buildSheffieldRow(), buildPeakRow(), buildBristolRow()];
  const generic = sourceClients
    .filter((client) => !featuredIds.has(client.id))
    .slice(0, 12)
    .map(buildGenericClientRow);
  const rows = [...featured, ...generic].sort((a, b) => a.healthScore - b.healthScore);

  const atRisk = rows.filter((row) => row.healthBand === "at-risk").length;
  const onboarding = sourceClients.filter((c) => c.accountStatus === "Onboarding").length;
  const renewalNext90 = rows.filter((row) => row.renewalInDays != null && row.renewalInDays <= 90).length;
  const portfolioArrGbp = rows.reduce((sum, row) => sum + row.arrGbp, 0);

  const priorityActions: NorthstarIntelAction[] = [
    {
      id: "cl-1",
      title: "Sheffield — weekly exec QBR until UAT signed",
      rationale: "Renewal in 87 days with Atlas slip and 8 open tickets — board already watching.",
      owner: "Marcus Reed",
      priority: "now",
    },
    {
      id: "cl-2",
      title: "Clear Sheffield AR overdue before renewal conversation",
      rationale: "Overdue invoice undermines trust during milestone credit negotiations.",
      owner: "Finance",
      priority: "now",
    },
    {
      id: "cl-3",
      title: "Bristol — slot into firmware QA queue",
      rationale: "Onboarding will stall without shared validation capacity.",
      owner: "James Okonkwo",
      priority: "this-week",
    },
    {
      id: "cl-4",
      title: "Peak — deliver fermentation export + pitch Phase 2",
      rationale: "Healthy account ready for expansion if we close the small ask quickly.",
      owner: "Elena Hart",
      priority: "this-week",
    },
  ];

  return {
    asAt: northstarDemoAsAtLabel(),
    posture: atRisk > 0 || renewalNext90 > 0 ? "watch" : "healthy",
    postureReason:
      atRisk > 0
        ? `${atRisk} account(s) at risk — Sheffield renewal and Atlas delivery are the immediate focus.`
        : "Portfolio health is stable across active manufacturing accounts.",
    summary: {
      activeAccounts: sourceClients.filter((c) => c.accountStatus === "Active").length,
      atRisk,
      onboarding,
      renewalNext90Days: renewalNext90,
      portfolioArrGbp,
    },
    rows,
    priorityActions,
  };
}

export function buildNorthstarMarketIntelligence(): NorthstarMarketIntelligence {
  const signals: NorthstarMarketSignal[] = [
    {
      id: "mkt-1",
      title: "SenseForge predictive maintenance launch",
      category: "competitive",
      severity: "high",
      summary:
        "Direct competitor targeting UK mid-market manufacturers with bundled edge + ML — pricing 15% below Atlas list for year-one.",
      implication:
        "Sheffield renewal and US pilot positioning will be benchmarked against SenseForge if we slip Atlas go-live.",
      response:
        "Arm sales with Atlas differentiation (OPC-UA depth, on-prem option). Accelerate Sheffield reference case.",
      source: "Competitive desk · Aug 2026",
    },
    {
      id: "mkt-2",
      title: "EU Machinery Regulation — cyber-resilience draft",
      category: "regulatory",
      severity: "medium",
      summary:
        "Connected industrial equipment may require documented security lifecycle and update paths from 2027.",
      implication: "Atlas edge controllers need compliance roadmap for EU export customers.",
      response: "Brief product + QMS — gap analysis against edge firmware OTA process.",
      source: "Regulatory monitor · Jul 2026",
    },
    {
      id: "mkt-3",
      title: "Industrial IoT M&A — two UK bolt-ons",
      category: "sector",
      severity: "info",
      summary: "PE-backed roll-ups acquiring regional monitoring vendors — valuation multiples ~4.5× ARR.",
      implication: "Potential acquirers or partners for US expansion; also competitive consolidation risk.",
      response: "Track targets for partnership before exclusivity — do not distract core delivery.",
      source: "Market scanner · Aug 2026",
    },
    {
      id: "mkt-4",
      title: "UK manufacturing PMI softening",
      category: "macro",
      severity: "medium",
      summary: "PMI 47.2 — capex caution among mid-market manufacturers through Q4 2026.",
      implication: "Longer sales cycles; higher proof-of-value burden on new logos.",
      response: "Lead with ROI case studies (Sheffield, Peak) and shorter pilot SOWs.",
      source: "ONS / S&P Global · Aug 2026",
    },
    {
      id: "mkt-5",
      title: "US mid-market IIoT adoption accelerating",
      category: "macro",
      severity: "info",
      summary: "Austin expansion pipeline (Summit Foods) aligns with sector demand — if security review passes.",
      implication: "Supports US hire plan but only if UK delivery stabilises first.",
      response: "Sequence US spend behind Sheffield reference + SenseForge battlecard.",
      source: "Internal pipeline · Aug 2026",
    },
  ];

  const priorityActions: NorthstarIntelAction[] = [
    {
      id: "mk-1",
      title: "Publish SenseForge competitive battlecard",
      rationale: "Sales and CS need scripted responses before Sheffield renewal meetings.",
      owner: "Product Marketing",
      priority: "now",
    },
    {
      id: "mk-2",
      title: "EU cyber-resilience gap analysis on Atlas edge",
      rationale: "Regulatory draft may become tender requirement in 2027 — early mover advantage.",
      owner: "QMS + Engineering",
      priority: "this-week",
    },
    {
      id: "mk-3",
      title: "Refresh ROI one-pager from Sheffield + Peak outcomes",
      rationale: "PMI softness means buyers need proof, not platform slides.",
      owner: "Sales Enablement",
      priority: "this-week",
    },
  ];

  return {
    asAt: northstarDemoAsAtLabel(),
    posture: "watch",
    postureReason:
      "SenseForge launch and EU regulatory draft are active; macro softness lengthens UK sales cycles.",
    signals,
    priorityActions,
  };
}

/** Flatten for intelligence API / EA tools. */
export function northstarCompanyIntelligenceRecords(): IntelligenceRecord[] {
  const data = buildNorthstarCompanyIntelligence();
  return data.deliverySignals.map((signal, index) => ({
    id: `nst-co-${index + 1}`,
    workspaceSlug: "demo",
    domainId: "company-intelligence",
    title: signal.title,
    summary: signal.detail,
    severity: signal.severity,
    categories: [{ id: "operations", label: "Operations" }],
    tags: [{ id: "northstar", label: "Northstar" }],
  }));
}

export function northstarClientIntelligenceRecords(): IntelligenceRecord[] {
  const data = buildNorthstarClientIntelligence();
  return data.rows
    .filter((row) => row.healthBand !== "healthy")
    .map((row) => ({
      id: `nst-cl-${row.id}`,
      workspaceSlug: "demo",
      domainId: "client-intelligence",
      title: `${row.name} — ${row.healthBand === "at-risk" ? "at risk" : "watch"}`,
      summary: row.issues[0] ?? "Account requires review",
      severity: row.healthBand === "at-risk" ? "high" : "medium",
      score: { value: row.healthScore, band: row.healthBand, label: "Health" },
      categories: [{ id: "retention", label: "Retention" }],
      tags: [{ id: row.id, label: row.name }],
    }));
}

export function northstarMarketIntelligenceRecords(): IntelligenceRecord[] {
  const data = buildNorthstarMarketIntelligence();
  return data.signals.map((signal) => ({
    id: signal.id,
    workspaceSlug: "demo",
    domainId: "market-intelligence",
    title: signal.title,
    summary: signal.summary,
    severity: signal.severity,
    categories: [{ id: signal.category, label: signal.category }],
    tags: [{ id: signal.category, label: signal.category }],
  }));
}
