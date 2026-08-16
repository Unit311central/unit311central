/**
 * Northstar Demo — module fixtures (never sourced from OnwardAir / Internal / other workspaces).
 */

import type { FinancialOverviewSnapshot } from "@/lib/accounting/types";
import type { LedgerAccount, JournalEntry, TrialBalanceRow } from "@/lib/accounting/types";
import type { ClientOnboardingRecord } from "@/lib/client-onboarding-data";
import type { CrmLead } from "@/lib/crm-data";
import { getDemoEnterpriseFixtures } from "@/lib/demo-enterprise";
import {
  NORTHSTAR_AP_DUE_NOW,
  NORTHSTAR_AP_DUE_WITHIN_MONTH,
  NORTHSTAR_AP_OUTSTANDING,
  NORTHSTAR_BURN_PREVIOUS_MONTHLY,
  NORTHSTAR_CASH_GBP,
  NORTHSTAR_MONTHLY_OPEX,
  NORTHSTAR_MONTHLY_REVENUE,
  NORTHSTAR_NET_PROFIT_YTD,
  NORTHSTAR_OPEX_BREAKDOWN,
  NORTHSTAR_REVENUE_YTD,
  northstarFinancialMonths,
  northstarMonthlyOpexForMonth,
  northstarMonthlyRevenueForMonth,
} from "@/lib/demo/northstar-financial-model";
import type { GrantApplication } from "@/lib/grants-data";
import type { InternalProject } from "@/lib/projects-data";
import type { PotentialClientsCountrySnapshot } from "@/lib/potential-clients-data";
import type {
  DataRoomRow,
  FundraisingMeeting,
  FundraisingPipelineDeal,
  PitchDeckVersion,
} from "@/lib/demo/fundraising-data";

const WS = "demo";
const NOW = "2026-08-16T10:00:00.000Z";

function lead(partial: {
  id: string;
  companyName: string;
  contactName: string;
  status: CrmLead["status"];
  email: string;
  estimatedValue: number;
  source?: string;
  nextAction?: string;
}): CrmLead {
  const [firstName, ...rest] = partial.contactName.split(" ");
  const surname = rest.join(" ") || "Contact";
  return {
    id: partial.id,
    workspaceId: WS,
    companyName: partial.companyName,
    contactName: partial.contactName,
    firstName,
    surname,
    role: "Operations Director",
    email: partial.email,
    phone: "+44 161 555 0142",
    status: partial.status,
    source: partial.source ?? "Referral",
    nextAction: partial.nextAction ?? "Book discovery call",
    nextActionDate: "2026-08-22",
    estimatedValue: partial.estimatedValue,
    notes: "Northstar industrial IoT prospect.",
    discoveryNotes: "",
    lastContactAt: "2026-08-10T09:00:00.000Z",
    lastActivityAt: "2026-08-10T09:00:00.000Z",
    contactCount: 2,
    needsManualReview: false,
    manualReviewReason: "",
    originalEnquirySubject: "",
    originalEnquiryMessage: "",
    originalEnquirySubmittedAt: null,
    clientReportFileId: null,
    clientReportFileName: null,
    clientReportGeneratedAt: null,
    clientReportPptFileId: null,
    clientReportPptFileName: null,
    clientReportSentAt: null,
    clientReportMessageId: null,
    clientReportRepliedAt: null,
    clientReportReminder7dSentAt: null,
    clientReportReminder14dSentAt: null,
    clientReportLastReminderSentAt: null,
    clientChatRoom: null,
    clientChatKey: null,
    clientChatAccessToken: null,
    companyLogoFileId: null,
    companyLogoFileName: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

export function getNorthstarCrmLeads(): CrmLead[] {
  return [
    lead({
      id: "nst-lead-001",
      companyName: "Sheffield Precision Engineering",
      contactName: "Tom Bradley",
      status: "Hot",
      email: "t.bradley@sheffieldprecision.co.uk",
      estimatedValue: 185_000,
      source: "Trade show",
      nextAction: "Send monitoring platform proposal",
    }),
    lead({
      id: "nst-lead-002",
      companyName: "Midlands Food Processing Co",
      contactName: "Helen Marsh",
      status: "Warm",
      email: "h.marsh@midlandsfood.co.uk",
      estimatedValue: 92_000,
      source: "LinkedIn",
    }),
    lead({
      id: "nst-lead-003",
      companyName: "Bristol Composites Ltd",
      contactName: "Oliver Grant",
      status: "Warm",
      email: "o.grant@bristolcomposites.co.uk",
      estimatedValue: 128_000,
    }),
    lead({
      id: "nst-lead-004",
      companyName: "Yorkshire Steel Fabricators",
      contactName: "Amelia Hughes",
      status: "Cold",
      email: "a.hughes@yorkshiresteel.co.uk",
      estimatedValue: 64_000,
      source: "Cold outreach",
    }),
    lead({
      id: "nst-lead-005",
      companyName: "Peak District Breweries",
      contactName: "Daniel Wright",
      status: "Won",
      email: "d.wright@peakbrew.co.uk",
      estimatedValue: 210_000,
      nextAction: "Kick-off workshop",
    }),
    lead({
      id: "nst-lead-006",
      companyName: "Cardiff Port Logistics",
      contactName: "Siân Evans",
      status: "Hot",
      email: "s.evans@cardiffportlogistics.co.uk",
      estimatedValue: 156_000,
    }),
  ];
}

export function getNorthstarDiscoveryMeetings() {
  return [
    {
      id: "nst-meet-001",
      name: "James Okonkwo",
      organization: "Sheffield Precision Engineering",
      role: "CTO",
      email: "j.okonkwo@sheffieldprecision.co.uk",
      startsAt: "2026-08-20T09:00:00.000Z",
      endsAt: "2026-08-20T09:45:00.000Z",
      formattedWhenGmt: "Wed 20 Aug 2026, 10:00",
      formattedWhenClient: "Wed 20 Aug 2026, 10:00 BST",
      clientTimezone: "Europe/London",
      clientTimezoneAbbrev: "BST",
      status: "scheduled",
      statusLabel: "Scheduled",
      meetingSlug: "sheffield-precision-discovery",
      meetingLink: "https://meet.northstar.demo/sheffield-precision",
      startReminderSentAt: null,
      transcriptSavedAt: null,
      transcriptFileId: null,
      focusOverviewPdfFileId: null,
      focusSelectionsSubmittedAt: null,
    },
    {
      id: "nst-meet-002",
      name: "Priya Shah",
      organization: "Midlands Food Processing Co",
      role: "Head of Operations",
      email: "p.shah@midlandsfood.co.uk",
      startsAt: "2026-08-21T14:00:00.000Z",
      endsAt: "2026-08-21T14:30:00.000Z",
      formattedWhenGmt: "Thu 21 Aug 2026, 15:00",
      formattedWhenClient: "Thu 21 Aug 2026, 15:00 BST",
      clientTimezone: "Europe/London",
      clientTimezoneAbbrev: "BST",
      status: "confirmed",
      statusLabel: "Confirmed",
      meetingSlug: "midlands-food-discovery",
      meetingLink: "https://meet.northstar.demo/midlands-food",
      startReminderSentAt: "2026-08-18T08:00:00.000Z",
      transcriptSavedAt: null,
      transcriptFileId: null,
      focusOverviewPdfFileId: null,
      focusSelectionsSubmittedAt: "2026-08-17T11:20:00.000Z",
    },
  ];
}

export function getNorthstarProjects(): InternalProject[] {
  return [
    {
      id: "nst-prj-001",
      name: "Edge Controller Rollout — Sheffield Precision",
      clientId: "nst-cli-sheffield",
      clientName: "Sheffield Precision Engineering",
      site: "Sheffield, UK",
      region: "UK",
      operator: "Marcus Reed",
      phase: "live",
      startDate: "2026-03-01",
      endDate: "2026-09-30",
      progressPct: 62,
      notes: "Phase 2 gateway deployment in progress.",
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: "nst-prj-002",
      name: "IoT Monitoring Platform — Peak District Breweries",
      clientId: "nst-cli-peak",
      clientName: "Peak District Breweries",
      site: "Bakewell, UK",
      region: "UK",
      operator: "Elena Hart",
      phase: "live",
      startDate: "2026-01-15",
      endDate: "2026-08-31",
      progressPct: 88,
      notes: "UAT sign-off scheduled.",
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: "nst-prj-003",
      name: "Predictive Maintenance Pilot — Bristol Composites",
      clientId: "nst-cli-bristol",
      clientName: "Bristol Composites Ltd",
      site: "Bristol, UK",
      region: "UK",
      operator: "James Okonkwo",
      phase: "upcoming",
      startDate: "2026-09-01",
      endDate: "2026-12-15",
      progressPct: 12,
      notes: "Discovery complete — SOW in legal review.",
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: "nst-prj-004",
      name: "Legacy PLC Integration — Cardiff Port Logistics",
      clientId: "nst-cli-cardiff",
      clientName: "Cardiff Port Logistics",
      site: "Cardiff, UK",
      region: "UK",
      operator: "Priya Shah",
      phase: "live",
      startDate: "2026-05-01",
      endDate: "2026-11-30",
      progressPct: 41,
      notes: "Behind plan — waiting on client OT network access.",
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];
}

export function getNorthstarOnboardingRecords(): ClientOnboardingRecord[] {
  const { listNorthstarOnboardingDemoRecords } =
    require("@/lib/demo/northstar-demo-store") as typeof import("@/lib/demo/northstar-demo-store");
  return listNorthstarOnboardingDemoRecords();
}

export function getNorthstarGrantApplications(): GrantApplication[] {
  return [
    {
      id: "nst-grant-1",
      programme: "Innovate UK Smart Grant",
      funder: "UKRI",
      title: "Industrial edge telemetry for SME factories",
      amountEur: 220_000,
      status: "Under Review",
      owner: "Elena Hart",
      submittedAt: "2026-06-12",
      deadline: "2026-09-30",
      region: "UK",
      coFundingPct: 30,
    },
    {
      id: "nst-grant-2",
      programme: "Made Smarter Adoption",
      funder: "BEIS",
      title: "North West manufacturing digitalisation cohort",
      amountEur: 185_000,
      status: "Approved",
      owner: "Marcus Reed",
      submittedAt: "2026-03-01",
      deadline: "2026-08-01",
      region: "UK",
      coFundingPct: 25,
    },
    {
      id: "nst-grant-3",
      programme: "Horizon Europe",
      funder: "European Commission",
      title: "Secure OT-to-cloud monitoring toolkit",
      amountEur: 450_000,
      status: "Submitted",
      owner: "James Okonkwo",
      submittedAt: "2026-07-18",
      deadline: "2026-10-15",
      region: "EU",
      coFundingPct: 20,
    },
    {
      id: "nst-grant-4",
      programme: "High Value Manufacturing Catapult",
      funder: "HVM Catapult",
      title: "Factory floor digital twin pilot",
      amountEur: 95_000,
      status: "Under Review",
      owner: "Elena Hart",
      submittedAt: "2026-05-20",
      deadline: "2026-09-01",
      region: "UK",
      coFundingPct: 15,
    },
    {
      id: "nst-grant-5",
      programme: "Regional Growth Fund",
      funder: "MIDAS",
      title: "Trafford Park smart factory cluster",
      amountEur: 65_000,
      status: "Submitted",
      owner: "Marcus Reed",
      submittedAt: "2026-07-01",
      deadline: "2026-10-30",
      region: "UK",
      coFundingPct: 10,
    },
    {
      id: "nst-grant-6",
      programme: "Innovate UK Feasibility",
      funder: "UKRI",
      title: "Predictive maintenance for packaging lines",
      amountEur: 45_000,
      status: "Draft",
      owner: "Priya Shah",
      submittedAt: null,
      deadline: "2026-11-15",
      region: "UK",
      coFundingPct: 20,
    },
    {
      id: "nst-grant-7",
      programme: "DESNZ Industrial Energy",
      funder: "DESNZ",
      title: "Energy monitoring for heavy industry SMEs",
      amountEur: 35_000,
      status: "Submitted",
      owner: "James Okonkwo",
      submittedAt: "2026-06-28",
      deadline: "2026-09-20",
      region: "UK",
      coFundingPct: 15,
    },
    {
      id: "nst-grant-8",
      programme: "EIC Accelerator",
      funder: "European Commission",
      title: "Edge AI for industrial safety systems",
      amountEur: 180_000,
      status: "Under Review",
      owner: "James Okonkwo",
      submittedAt: "2026-07-05",
      deadline: "2026-10-01",
      region: "EU",
      coFundingPct: 25,
    },
    {
      id: "nst-grant-9",
      programme: "Digital Europe Programme",
      funder: "European Commission",
      title: "Cross-border OT cybersecurity toolkit",
      amountEur: 95_000,
      status: "Draft",
      owner: "Elena Hart",
      submittedAt: null,
      deadline: "2026-12-01",
      region: "EU",
      coFundingPct: 20,
    },
  ];
}

export const NORTHSTAR_GRANTS_KPIS = [
  {
    id: "pipeline",
    label: "Grant pipeline",
    value: "UK 6 · EU 3",
    change: "9 applications",
    trend: "up" as const,
    hint: "£1.37M total pipeline value",
  },
  {
    id: "approved-ytd",
    label: "Approved YTD",
    value: "£185k",
    change: "+1 award",
    trend: "up" as const,
    hint: "Made Smarter Adoption",
  },
  {
    id: "under-review",
    label: "Under review",
    value: "2",
    change: "Innovate UK due Sep",
    trend: "neutral" as const,
    hint: "Awaiting assessor feedback",
  },
  {
    id: "success-rate",
    label: "Success rate",
    value: "72%",
    change: "+4 pts",
    trend: "up" as const,
    hint: "Rolling 12-month win rate",
  },
];

export const NORTHSTAR_POTENTIAL_CLIENTS: PotentialClientsCountrySnapshot[] = [
  {
    id: "uk",
    label: "United Kingdom",
    regionNote: "North West & Midlands manufacturing SMEs",
    startups2025: 48_200,
    startups2025MultiDirector: 31_400,
    startupsFundedOver100k: 2_180,
    smesOver6Months: 892_000,
    smesEmployees10to200: 124_000,
    industries: [
      { id: "mfg", label: "Advanced manufacturing", startupCount: 12_400, sharePercent: 26 },
      { id: "food", label: "Food & beverage processing", startupCount: 8_900, sharePercent: 18 },
      { id: "logistics", label: "Industrial logistics", startupCount: 6_200, sharePercent: 13 },
    ],
    source: { name: "Companies House + ONS BPE", url: "https://www.gov.uk/government/organisations/companies-house" },
    methodologyNote: "Northstar ICP focus — UK manufacturers with 50–500 employees and legacy OT assets.",
  },
  {
    id: "us",
    label: "United States",
    regionNote: "Midwest & Gulf Coast industrial automation",
    startups2025: 312_000,
    startups2025MultiDirector: 198_000,
    startupsFundedOver100k: 18_400,
    smesOver6Months: 4_200_000,
    smesEmployees10to200: 620_000,
    industries: [
      { id: "mfg", label: "Industrial automation", startupCount: 42_000, sharePercent: 13 },
      { id: "energy", label: "Energy & utilities", startupCount: 28_500, sharePercent: 9 },
      { id: "aerospace", label: "Aerospace components", startupCount: 19_200, sharePercent: 6 },
    ],
    source: { name: "US Census Bureau BDS", url: "https://www.census.gov/programs-surveys/bds.html" },
    methodologyNote: "US expansion targets — factories with legacy PLCs and multi-site OT estates.",
  },
  {
    id: "de",
    label: "Germany",
    regionNote: "Mittelstand manufacturing & Industrie 4.0",
    startups2025: 86_400,
    startups2025MultiDirector: 52_100,
    startupsFundedOver100k: 4_800,
    smesOver6Months: 1_240_000,
    smesEmployees10to200: 198_000,
    industries: [
      { id: "mfg", label: "Precision engineering", startupCount: 18_600, sharePercent: 22 },
      { id: "auto", label: "Automotive supply chain", startupCount: 14_200, sharePercent: 16 },
      { id: "chem", label: "Chemical processing", startupCount: 9_800, sharePercent: 11 },
    ],
    source: { name: "Destatis + KfW Mittelstand", url: "https://www.destatis.de" },
    methodologyNote: "EU gateway market — German SMEs modernising OT monitoring and predictive maintenance.",
  },
];

export function getNorthstarFundraisingPipeline(): FundraisingPipelineDeal[] {
  return [
    {
      id: "nst-pipe-seed-mgp",
      investor: "Simon Wright",
      firm: "Midlands Growth Partners",
      stage: "Term sheet",
      amountGbp: 2_500_000,
      owner: "Elena Hart",
      lastTouch: "2026-08-12",
      notes: "Lead candidate for £5M seed round.",
    },
    {
      id: "nst-pipe-seed-iif",
      investor: "Helena Voigt",
      firm: "Industrial Innovation Fund",
      stage: "Diligence",
      amountGbp: 1_500_000,
      owner: "Priya Shah",
      lastTouch: "2026-08-08",
      notes: "Technical diligence — Manchester site visit completed.",
    },
    {
      id: "nst-pipe-seed-ntv",
      investor: "David Chen",
      firm: "Northern Tech Ventures",
      stage: "Meeting",
      amountGbp: 1_000_000,
      owner: "Elena Hart",
      lastTouch: "2026-08-14",
      notes: "Pre-seed lead — pro-rata for seed extension.",
    },
  ];
}

export function getNorthstarFundraisingMeetings(): FundraisingMeeting[] {
  return [
    {
      id: "nst-fr-meet-1",
      title: "Series B intro — Midlands Growth Partners",
      investor: "Simon Wright",
      firm: "Midlands Growth Partners",
      withWhom: "Elena Hart, Priya Shah",
      date: "2026-08-22",
      time: "10:00 BST",
      meetingLink: "https://meet.northstar.demo/mgp-intro",
      pitchDeckSent: true,
      owner: "Elena Hart",
      status: "Confirmed",
    },
    {
      id: "nst-fr-meet-2",
      title: "Diligence deep-dive — Industrial Innovation Fund",
      investor: "Helena Voigt",
      firm: "Industrial Innovation Fund",
      withWhom: "James Okonkwo, Priya Shah",
      date: "2026-08-28",
      time: "14:30 BST",
      meetingLink: "https://meet.northstar.demo/iif-diligence",
      pitchDeckSent: true,
      owner: "Priya Shah",
      status: "Scheduled",
    },
  ];
}

export function getNorthstarPitchDecks(): PitchDeckVersion[] {
  return [
    {
      id: "nst-deck-1",
      version: "3.2",
      title: "Northstar Industrial Technologies — Investor Overview",
      dateAdded: "2026-06-01",
      lastUpdatedAt: "2026-08-10T09:00:00.000Z",
      lastUpdatedBy: "Elena Hart",
      fileName: "Northstar_Investor_Overview_v3.2.pdf",
      notes: "ARR £4.8M, GM 54%, Manchester HQ.",
    },
    {
      id: "nst-deck-2",
      version: "3.1",
      title: "Northstar — Product & Traction",
      dateAdded: "2026-04-15",
      lastUpdatedAt: "2026-07-02T11:00:00.000Z",
      lastUpdatedBy: "James Okonkwo",
      fileName: "Northstar_Product_Traction_v3.1.pdf",
      notes: "Edge controller deployments and case studies.",
    },
  ];
}

export function getNorthstarDataRooms(): DataRoomRow[] {
  return [
    {
      id: "nst-dr-1",
      investor: "Helena Voigt",
      firm: "Industrial Innovation Fund",
      folderLink: "https://dataroom.northstar.demo/iif",
      lastUpdatedAt: "2026-08-09T16:00:00.000Z",
      lastUpdatedBy: "Priya Shah",
      documents: 24,
      status: "Open",
    },
    {
      id: "nst-dr-2",
      investor: "Simon Wright",
      firm: "Midlands Growth Partners",
      folderLink: "https://dataroom.northstar.demo/mgp",
      lastUpdatedAt: "2026-08-11T10:30:00.000Z",
      lastUpdatedBy: "Elena Hart",
      documents: 18,
      status: "Restricted",
    },
  ];
}

export function buildNorthstarFinancialOverview(): FinancialOverviewSnapshot {
  const fixtures = getDemoEnterpriseFixtures();
  const cash = fixtures.company.cashGbp ?? NORTHSTAR_CASH_GBP;
  const monthlyRevenue = NORTHSTAR_MONTHLY_REVENUE;
  const monthlyExpenses = NORTHSTAR_MONTHLY_OPEX;
  const months = northstarFinancialMonths();
  const monthSeries: { month: string; amount: number }[] = [];
  const plSeries: { month: string; profit: number; loss: number }[] = [];
  const cashSeries: { month: string; amount: number }[] = [];
  let runningCash = cash - months.length * 18_000;

  for (const month of months) {
    const revenue = northstarMonthlyRevenueForMonth(month);
    const expenses = northstarMonthlyOpexForMonth(month);
    monthSeries.push({ month, amount: revenue });
    plSeries.push({
      month,
      profit: Math.max(0, revenue - expenses),
      loss: Math.max(0, expenses - revenue),
    });
    runningCash += revenue - expenses;
    cashSeries.push({ month, amount: Math.max(420_000, runningCash) });
  }
  if (cashSeries.length > 0) {
    cashSeries[cashSeries.length - 1] = { month: cashSeries[cashSeries.length - 1]!.month, amount: cash };
  }

  const burnQuarterly = monthlyExpenses * 3;
  const burnAnnual = monthlyExpenses * 12;

  return {
    revenueYtd: NORTHSTAR_REVENUE_YTD,
    cashPosition: cash,
    accountsReceivable: 420_000,
    accountsPayable: NORTHSTAR_AP_OUTSTANDING,
    netProfit: NORTHSTAR_NET_PROFIT_YTD,
    outstandingInvoices: 12,
    monthlyRevenue,
    monthlyExpenses,
    annualRevenue: monthlyRevenue * 12,
    annualExpenses: monthlyExpenses * 12,
    burnRate: {
      source: "demo",
      currency: "GBP",
      monthly: monthlyExpenses,
      quarterly: burnQuarterly,
      annual: burnAnnual,
      previousMonthly: NORTHSTAR_BURN_PREVIOUS_MONTHLY,
      changePct: -5,
      trend: "improving",
      trendLabel: "Prior month £295k · people & opex",
      cashBalance: cash,
      runwayMonths: Math.round((cash / monthlyExpenses) * 10) / 10,
      forecastMonthly: monthlyExpenses,
      lines: [],
      series: monthSeries.map((row) => {
        const total = northstarMonthlyOpexForMonth(row.month);
        const payroll = Math.round(total * (NORTHSTAR_OPEX_BREAKDOWN.payroll / NORTHSTAR_MONTHLY_OPEX));
        const software = Math.round(total * (NORTHSTAR_OPEX_BREAKDOWN.software / NORTHSTAR_MONTHLY_OPEX));
        const office = Math.round(total * ((NORTHSTAR_OPEX_BREAKDOWN.rent + NORTHSTAR_OPEX_BREAKDOWN.cloud) / NORTHSTAR_MONTHLY_OPEX));
        const marketing = Math.round(total * (NORTHSTAR_OPEX_BREAKDOWN.marketing / NORTHSTAR_MONTHLY_OPEX));
        const travel = Math.round(total * (NORTHSTAR_OPEX_BREAKDOWN.travel / NORTHSTAR_MONTHLY_OPEX));
        const other = total - payroll - software - office - marketing - travel;
        return {
          month: row.month,
          total,
          payroll,
          contractors: 0,
          software,
          office,
          marketing,
          travel,
          other,
        };
      }),
      filterOptions: { departments: [], costCentres: [], projects: [], offices: [] },
    },
    ar: {
      outstanding: 420_000,
      overdue: 48_000,
      overdueCount: 2,
      dueSoon: 92_000,
      collectionRate: 94,
      ageing: [],
      recentUnpaid: [],
    },
    ap: {
      outstanding: NORTHSTAR_AP_OUTSTANDING,
      dueThisMonth: NORTHSTAR_AP_DUE_NOW,
      overdue: 0,
      upcoming: NORTHSTAR_AP_DUE_WITHIN_MONTH,
      recent: [],
    },
    payroll: {
      current: NORTHSTAR_OPEX_BREAKDOWN.payroll,
      next: NORTHSTAR_OPEX_BREAKDOWN.payroll,
      employees: 25,
      annual: NORTHSTAR_OPEX_BREAKDOWN.payroll * 12,
      monthly: NORTHSTAR_OPEX_BREAKDOWN.payroll,
      trend: [],
    },
    charts: {
      monthlyRevenue: monthSeries,
      monthlyProfitLoss: plSeries,
      monthlyOutgoings: monthSeries.map((row) => ({
        month: row.month,
        amount: northstarMonthlyOpexForMonth(row.month),
      })),
      cashPosition: cashSeries,
    },
    activity: [],
  };
}

export function getNorthstarLedgerAccounts(): LedgerAccount[] {
  const opex = NORTHSTAR_OPEX_BREAKDOWN;
  const accounts = [
    { code: "1010", name: "Wise GBP — Operating", type: "asset" as const, balance: 1_100_000 },
    { code: "1015", name: "Wise GBP — Reserves", type: "asset" as const, balance: 200_000 },
    { code: "1020", name: "Wise USD / EUR (GBP equiv.)", type: "asset" as const, balance: 800_000 },
    { code: "1030", name: "Accounts Receivable", type: "asset" as const, balance: 420_000 },
    { code: "1200", name: "Prepaid expenses", type: "asset" as const, balance: 28_000 },
    { code: "2000", name: "Accounts Payable", type: "liability" as const, balance: NORTHSTAR_AP_OUTSTANDING },
    { code: "2100", name: "Deferred revenue", type: "liability" as const, balance: 85_000 },
    { code: "3010", name: "Share capital (pre-seed)", type: "equity" as const, balance: 1_000_000 },
    { code: "3020", name: "Retained earnings", type: "equity" as const, balance: 1_433_000 },
    {
      code: "4010",
      name: "SaaS & monitoring revenue (current month)",
      type: "income" as const,
      balance: NORTHSTAR_MONTHLY_REVENUE,
    },
    { code: "5020", name: "Payroll (current month)", type: "expense" as const, balance: opex.payroll },
    { code: "5030", name: "Cloud & hosting (current month)", type: "expense" as const, balance: opex.cloud },
    { code: "5040", name: "Rent & facilities (current month)", type: "expense" as const, balance: opex.rent },
    { code: "5050", name: "Marketing (current month)", type: "expense" as const, balance: opex.marketing },
    { code: "5060", name: "Software & tools (current month)", type: "expense" as const, balance: opex.software },
    { code: "5070", name: "Professional services (current month)", type: "expense" as const, balance: opex.professional },
    { code: "5080", name: "Travel (current month)", type: "expense" as const, balance: opex.travel },
    { code: "5090", name: "Other operating expense (current month)", type: "expense" as const, balance: opex.other },
  ];
  return accounts.map((row, index) => ({
    id: `nst-gl-${row.code}`,
    code: row.code,
    name: row.name,
    type: row.type,
    balance: row.balance,
    currency: "GBP",
    isActive: true,
    transactionCount: 6 + (index % 5),
  }));
}

export function getNorthstarJournalEntries(): JournalEntry[] {
  const entries: JournalEntry[] = [];
  for (const month of northstarFinancialMonths()) {
    const revenue = northstarMonthlyRevenueForMonth(month);
    const opex = northstarMonthlyOpexForMonth(month);
    const payroll = Math.round(opex * (NORTHSTAR_OPEX_BREAKDOWN.payroll / NORTHSTAR_MONTHLY_OPEX));
    entries.push({
      id: `nst-je-rev-${month}`,
      reference: `REV-${month}`,
      description: `${month} SaaS & monitoring revenue recognition (UK FY)`,
      clientId: null,
      sourceType: "revenue",
      sourceId: null,
      status: "posted",
      journalDate: `${month}-01`,
      postedAt: `${month}-01T10:00:00.000Z`,
      createdAt: `${month}-01T10:00:00.000Z`,
      lines: [],
      debitTotal: revenue,
      creditTotal: revenue,
    });
    entries.push({
      id: `nst-je-opex-${month}`,
      reference: `OPEX-${month}`,
      description: `${month} operating expenses accrual`,
      clientId: null,
      sourceType: "expense",
      sourceId: null,
      status: "posted",
      journalDate: `${month}-28`,
      postedAt: `${month}-28T10:00:00.000Z`,
      createdAt: `${month}-28T10:00:00.000Z`,
      lines: [],
      debitTotal: opex,
      creditTotal: opex,
    });
    entries.push({
      id: `nst-je-pay-${month}`,
      reference: `PAY-${month}`,
      description: `${month} payroll accrual`,
      clientId: null,
      sourceType: "payroll",
      sourceId: null,
      status: "posted",
      journalDate: `${month}-28`,
      postedAt: `${month}-28T10:00:00.000Z`,
      createdAt: `${month}-28T10:00:00.000Z`,
      lines: [],
      debitTotal: payroll,
      creditTotal: payroll,
    });
  }
  return entries;
}

export function getNorthstarTrialBalance(): TrialBalanceRow[] {
  return getNorthstarLedgerAccounts().map((account) => ({
    accountId: account.id,
    code: account.code,
    name: account.name,
    type: account.type,
    debit: account.type === "expense" || account.type === "asset" ? account.balance : 0,
    credit: account.type === "income" || account.type === "liability" || account.type === "equity" ? account.balance : 0,
    runningBalance: account.balance,
  }));
}

export function getNorthstarClients() {
  const fixtures = getDemoEnterpriseFixtures();
  const company = fixtures.company.tradingName;
  const industries = ["Manufacturing", "Food & Beverage", "Logistics", "Energy", "Automotive"];
  const cities = [
    "Sheffield",
    "Manchester",
    "Birmingham",
    "Bristol",
    "Leeds",
    "Nottingham",
    "Cardiff",
    "Glasgow",
    "Liverpool",
    "Newcastle",
  ];
  const core = [
    {
      id: "nst-cli-sheffield",
      companyName: "Sheffield Precision Engineering",
      industry: "Manufacturing",
      primaryContact: "Tom Bradley",
      email: "t.bradley@sheffieldprecision.co.uk",
      phone: "+44 114 555 0101",
      region: "UK",
      accountStatus: "Active",
      contractType: "Subscription",
      taxId: "GB123456789",
      billingAddress: "Atlas Works, Sheffield S1 2BJ",
      activeProjects: 1,
      notes: `${company} edge monitoring deployment.`,
    },
    {
      id: "nst-cli-peak",
      companyName: "Peak District Breweries",
      industry: "Food & Beverage",
      primaryContact: "Daniel Wright",
      email: "d.wright@peakbrew.co.uk",
      phone: "+44 1629 555 012",
      region: "UK",
      accountStatus: "Active",
      contractType: "Statement of Work",
      taxId: "GB987654321",
      billingAddress: "Bakewell DE45 1GP",
      activeProjects: 1,
      notes: "IoT monitoring platform live.",
    },
    {
      id: "nst-cli-bristol",
      companyName: "Bristol Composites Ltd",
      industry: "Manufacturing",
      primaryContact: "Oliver Grant",
      email: "o.grant@bristolcomposites.co.uk",
      phone: "+44 117 555 0144",
      region: "UK",
      accountStatus: "Onboarding",
      contractType: "Framework Agreement",
      taxId: "GB555666777",
      billingAddress: "Temple Quay, Bristol BS1 6DZ",
      activeProjects: 1,
      notes: "Predictive maintenance pilot.",
    },
  ];
  const generated = Array.from({ length: 97 }, (_, index) => {
    const n = index + 4;
    const city = cities[index % cities.length]!;
    const industry = industries[index % industries.length]!;
    return {
      id: `nst-cli-${String(n).padStart(3, "0")}`,
      companyName: `${city} Industrial Systems ${n}`,
      industry,
      primaryContact: `Contact ${n}`,
      email: `contact${n}@${city.toLowerCase()}industrial.demo`,
      phone: `+44 161 555 ${String(1000 + n).slice(-4)}`,
      region: "UK",
      accountStatus: n % 7 === 0 ? "Onboarding" : "Active",
      contractType: n % 3 === 0 ? "Statement of Work" : "Subscription",
      taxId: `GB${String(100000000 + n)}`,
      billingAddress: `${city} Industrial Park`,
      activeProjects: n % 5 === 0 ? 2 : 1,
      notes: `${company} monitoring or edge deployment.`,
    };
  });
  return [...core, ...generated];
}

export function getNorthstarPartners() {
  return [
    {
      id: "nst-partner-1",
      workspaceId: "demo-workspace",
      firstName: "Helen",
      lastName: "Marsh",
      companyName: "Voltex Automation UK",
      email: "h.marsh@voltexautomation.co.uk",
      emailVerifiedAt: NOW,
      addressLine1: "14 Trafford Park",
      addressLine2: null,
      city: "Manchester",
      district: null,
      country: "United Kingdom",
      postcode: "M17 1HH",
      phoneCountryCode: "+44",
      phoneNumber: "1615550191",
      accountHolder: "Voltex Automation UK Ltd",
      bankName: "Barclays",
      bankAddress: null,
      accountNumber: "12345678",
      sortCode: "20-00-00",
      swift: null,
      iban: null,
      bic: null,
      routing: null,
      portalToken: "nst-voltex",
      portalUrl: "https://partners.northstar.demo/voltex",
      status: "active",
      intakeStep: "complete",
      notes: "Industrial components channel partner.",
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: "nst-partner-2",
      workspaceId: "demo-workspace",
      firstName: "Chris",
      lastName: "Palmer",
      companyName: "Midlands Systems Integrators",
      email: "c.palmer@midlandssi.co.uk",
      emailVerifiedAt: NOW,
      addressLine1: "2 Colmore Row",
      addressLine2: null,
      city: "Birmingham",
      district: null,
      country: "United Kingdom",
      postcode: "B3 2BJ",
      phoneCountryCode: "+44",
      phoneNumber: "1215550188",
      accountHolder: "Midlands Systems Integrators Ltd",
      bankName: "HSBC",
      bankAddress: null,
      accountNumber: "87654321",
      sortCode: "40-00-00",
      swift: null,
      iban: null,
      bic: null,
      routing: null,
      portalToken: "nst-midlands",
      portalUrl: "https://partners.northstar.demo/midlands",
      status: "active",
      intakeStep: "complete",
      notes: "Referral partner — West Midlands manufacturing.",
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];
}

/** Client-side helper — returns true on Demo host in the browser. */
export function isNorthstarDemoBrowser(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const { isBrowserDemoSurface } =
      require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
    return isBrowserDemoSurface();
  } catch {
    return false;
  }
}
