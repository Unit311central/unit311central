/**
 * Northstar Demo — module fixtures (never sourced from OnwardAir / Internal / other workspaces).
 */

import type { FinancialOverviewSnapshot } from "@/lib/accounting/types";
import type { LedgerAccount, JournalEntry, TrialBalanceRow } from "@/lib/accounting/types";
import type { ClientOnboardingRecord } from "@/lib/client-onboarding-data";
import type { CrmLead } from "@/lib/crm-data";
import { getDemoEnterpriseFixtures } from "@/lib/demo-enterprise";
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
  return [
    {
      id: "nst-onb-001",
      companyName: "Lancashire Packaging Systems",
      contactName: "Rachel Owen",
      contactEmail: "r.owen@lancashirepackaging.co.uk",
      signupDate: "2026-08-01",
      currentStage: "questionnaire_complete",
      progressPercent: 60,
      currentStatus: "In Progress",
      signedUpAt: "2026-08-01T09:00:00.000Z",
      paymentReceivedAt: "2026-08-02T14:00:00.000Z",
      questionnaireCompleteAt: "2026-08-10T16:30:00.000Z",
    },
    {
      id: "nst-onb-002",
      companyName: "Nottingham Automation Group",
      contactName: "Chris Palmer",
      contactEmail: "c.palmer@nottinghamauto.co.uk",
      signupDate: "2026-07-20",
      currentStage: "platform_clone_complete",
      progressPercent: 80,
      currentStatus: "In Progress",
      signedUpAt: "2026-07-20T11:00:00.000Z",
      paymentReceivedAt: "2026-07-21T09:00:00.000Z",
      questionnaireCompleteAt: "2026-07-28T10:00:00.000Z",
      platformCloneCompleteAt: "2026-08-05T12:00:00.000Z",
    },
  ];
}

export function getNorthstarGrantApplications(): GrantApplication[] {
  return [
    {
      id: "nst-grant-1",
      programme: "Innovate UK Smart Grant",
      funder: "UKRI",
      title: "Industrial edge telemetry for SME factories",
      amountEur: 420_000,
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
      amountEur: 680_000,
      status: "Submitted",
      owner: "James Okonkwo",
      submittedAt: "2026-07-18",
      deadline: "2026-10-15",
      region: "EU",
      coFundingPct: 20,
    },
  ];
}

export const NORTHSTAR_GRANTS_KPIS = [
  {
    id: "pipeline",
    label: "Grant pipeline",
    value: "£1.29M",
    change: "+£185k",
    trend: "up" as const,
    hint: "Active UK & EU applications",
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
];

export function getNorthstarFundraisingPipeline(): FundraisingPipelineDeal[] {
  return [
    {
      id: "nst-pipe-1",
      investor: "Simon Wright",
      firm: "Midlands Growth Partners",
      stage: "Meeting",
      amountGbp: 3_000_000,
      owner: "Elena Hart",
      lastTouch: "2026-08-12",
      notes: "Partner meeting scheduled Manchester — Series B track.",
    },
    {
      id: "nst-pipe-2",
      investor: "Helena Voigt",
      firm: "Industrial Innovation Fund",
      stage: "Diligence",
      amountGbp: 1_500_000,
      owner: "Priya Shah",
      lastTouch: "2026-08-08",
      notes: "Site visit completed — data room access granted.",
    },
    {
      id: "nst-pipe-3",
      investor: "David Chen",
      firm: "Northern Tech Ventures",
      stage: "Term sheet",
      amountGbp: 2_000_000,
      owner: "Elena Hart",
      lastTouch: "2026-08-14",
      notes: "Follow-on participation in growth extension.",
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
  const cash = fixtures.company.cashGbp;
  const monthlyRevenue = 400_000;
  const monthlyExpenses = 310_000;
  const month = new Date().toISOString().slice(0, 7);

  return {
    revenueYtd: 2_880_000,
    cashPosition: cash,
    accountsReceivable: 420_000,
    accountsPayable: 186_000,
    netProfit: 720_000,
    outstandingInvoices: 12,
    monthlyRevenue,
    monthlyExpenses,
    annualRevenue: 4_800_000,
    annualExpenses: 3_720_000,
    burnRate: {
      source: "demo",
      currency: "GBP",
      monthly: monthlyExpenses - monthlyRevenue < 0 ? monthlyRevenue - monthlyExpenses : 0,
      quarterly: 270_000,
      annual: 1_080_000,
      previousMonthly: 295_000,
      changePct: -5,
      trend: "improving",
      trendLabel: "Improving",
      cashBalance: cash,
      runwayMonths: Math.round((cash / 90_000) * 10) / 10,
      forecastMonthly: 300_000,
      lines: [],
      series: [],
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
    ap: { outstanding: 186_000, dueThisMonth: 64_000, overdue: 0, upcoming: 122_000, recent: [] },
    payroll: { current: 118_000, next: 118_000, employees: 25, annual: 1_416_000, monthly: 118_000, trend: [] },
    charts: {
      monthlyRevenue: [{ month, amount: monthlyRevenue }],
      monthlyProfitLoss: [{ month, profit: Math.max(0, monthlyRevenue - monthlyExpenses), loss: Math.max(0, monthlyExpenses - monthlyRevenue) }],
      monthlyOutgoings: [{ month, amount: monthlyExpenses }],
      cashPosition: [{ month, amount: cash }],
    },
    activity: [],
  };
}

export function getNorthstarLedgerAccounts(): LedgerAccount[] {
  const accounts = [
    { code: "1010", name: "Wise GBP", type: "asset" as const, balance: 1_900_000 },
    { code: "1030", name: "Accounts Receivable", type: "asset" as const, balance: 420_000 },
    { code: "2000", name: "Accounts Payable", type: "liability" as const, balance: 186_000 },
    { code: "3010", name: "Retained Earnings", type: "equity" as const, balance: 720_000 },
    { code: "4010", name: "SaaS & Monitoring Revenue", type: "income" as const, balance: 400_000 },
    { code: "5020", name: "Payroll Expense", type: "expense" as const, balance: 118_000 },
  ];
  return accounts.map((row, index) => ({
    id: `nst-gl-${index}`,
    code: row.code,
    name: row.name,
    type: row.type,
    balance: row.balance,
    currency: "GBP",
    isActive: true,
    transactionCount: 4 + index,
  }));
}

export function getNorthstarJournalEntries(): JournalEntry[] {
  return [
    {
      id: "nst-je-1",
      reference: "REV-2026-08",
      description: "August SaaS & monitoring revenue recognition",
      clientId: null,
      sourceType: "revenue",
      sourceId: null,
      status: "posted",
      journalDate: "2026-08-01",
      postedAt: NOW,
      createdAt: NOW,
      lines: [],
      debitTotal: 400_000,
      creditTotal: 400_000,
    },
    {
      id: "nst-je-2",
      reference: "PAY-2026-08",
      description: "August payroll accrual",
      clientId: null,
      sourceType: "payroll",
      sourceId: null,
      status: "posted",
      journalDate: "2026-08-31",
      postedAt: NOW,
      createdAt: NOW,
      lines: [],
      debitTotal: 118_000,
      creditTotal: 118_000,
    },
  ];
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
  return [
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
