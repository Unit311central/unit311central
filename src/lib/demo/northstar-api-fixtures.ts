/**
 * Northstar Demo — API route fixtures (never OnwardAir / Meridian / other workspaces).
 */

import type { LedgerInvoice } from "@/lib/accounting/types";
import type { BoardDirector } from "@/lib/board-directors-service";
import type { CalendarEvent } from "@/lib/calendar-data";
import type { CrmConnection } from "@/lib/connections-data";
import { NORTHSTAR_BOARD_DIRECTORS } from "@/lib/demo/board-data";
import { getDemoEnterpriseFixtures } from "@/lib/demo-enterprise";
import type { FinancialExpense } from "@/lib/expenses-data";
import { type HrEmployee } from "@/lib/hr-data";
import type { MarketingDashboardKpis } from "@/lib/marketing/types";
import type { SoftwareAsset, SoftwareAssetsSummary } from "@/lib/software-assets-data";
import type { SupportTicket } from "@/lib/support-data";
import type { IntegrationConnectionPublic } from "@/lib/integration-framework-data";
import type { ManagedUser } from "@/lib/user-management-data";
import { computeSoftwareAssetsSummary } from "@/lib/software-assets-data";
import { DEMO_PROSPECT_USERNAME } from "@/lib/demo/read-only";
import type { PlatformSession } from "@/lib/platform-session";

import { northstarFinancialMonths } from "@/lib/demo/northstar-financial-model";

const WS = "demo-workspace";
const NOW = "2026-08-16T10:00:00.000Z";

export function getNorthstarWhoamiPayload(session: PlatformSession | null) {
  const fixtures = getDemoEnterpriseFixtures();
  const directory = fixtures.directory;
  const matched =
    directory.find((row) => row.email.toLowerCase() === session?.username?.toLowerCase()) ??
    directory.find((row) => row.role.toLowerCase().includes("chief executive")) ??
    directory[0];

  return {
    displayName: session?.displayName?.trim() || matched?.fullName || fixtures.company.tradingName,
    username: session?.username || DEMO_PROSPECT_USERNAME,
    email: matched?.email || session?.username || DEMO_PROSPECT_USERNAME,
    role: matched?.role || "Admin",
    roles: matched ? [matched.role] : null,
    department: matched?.department || "Executive",
    departments: matched ? [matched.department] : null,
    allowedViews: null as string[] | null,
    dashboardPrefs: null as { homeTiles: string[] } | null,
    userType: session?.userType ?? "internal",
    userId: session?.sub ?? matched?.id ?? "nst-demo-operator",
    workspaceId: WS,
    workspaceSlug: "demo",
    workspaceName: fixtures.company.tradingName,
    workspaceLogoUrl: null as string | null,
  };
}

export function getNorthstarWebsiteCmsConnections(): IntegrationConnectionPublic[] {
  const fixtures = getDemoEnterpriseFixtures();
  return [
    {
      id: "nst-cms-northstar",
      workspaceId: WS,
      providerId: "provider-cms-northstar",
      providerCode: "cms.wordpress",
      providerDisplayName: "Northstar CMS",
      category: "website",
      enabled: true,
      status: "connected",
      manualMode: false,
      authMethod: "api_key",
      isDefaultForCategory: true,
      displayLabel: "Northstar",
      credentialsSet: true,
      config: { siteUrl: `https://www.${fixtures.company.domain}` },
      capabilities: ["content", "deploy"],
      notes: null,
      lastHealthAt: NOW,
      lastHealthStatus: "healthy",
      lastError: null,
      lastTestedAt: NOW,
      createdBy: null,
      updatedBy: null,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];
}

const EXPENSE_TEMPLATES = [
  { supplier: "Amazon Web Services", category: "5030", purpose: "Cloud infrastructure", base: 980 },
  { supplier: "GitHub", category: "5060", purpose: "GitHub Enterprise + CI", base: 890 },
  { supplier: "Trainline / Premier Inn", category: "5080", purpose: "Site visit travel", base: 420 },
  { supplier: "Voltex Automation UK", category: "5090", purpose: "Edge controller components", base: 8_400 },
  { supplier: "Trafford Park Estates Ltd", category: "5040", purpose: "Manchester office rent", base: 5_000 },
  { supplier: "Temple Quay Developments Ltd", category: "5040", purpose: "Bristol office rent", base: 5_000 },
  { supplier: "Brazos Street Properties LLC", category: "5040", purpose: "Austin office rent", base: 5_000 },
  { supplier: "Google Ads", category: "5050", purpose: "Demand generation campaign", base: 2_100 },
  { supplier: "Deloitte LLP", category: "5070", purpose: "Audit & advisory", base: 4_200 },
  { supplier: "Slack / Atlassian", category: "5060", purpose: "Team productivity stack", base: 640 },
  { supplier: "National Rail", category: "5080", purpose: "Customer site travel", base: 280 },
  { supplier: "RS Components", category: "5090", purpose: "Lab hardware consumables", base: 1_150 },
] as const;

const SUBMITTERS = [
  { id: "nst-emp-elena", name: "Elena Hart" },
  { id: "nst-emp-marcus", name: "Marcus Reed" },
  { id: "nst-emp-priya", name: "Priya Shah" },
  { id: "nst-emp-james", name: "James Okonkwo" },
] as const;

let cachedNorthstarExpenses: FinancialExpense[] | null = null;

function buildNorthstarExpenseHistory(): FinancialExpense[] {
  const expenses: FinancialExpense[] = [];
  let counter = 0;

  for (const month of northstarFinancialMonths()) {
    const [year, monthNum] = month.split("-").map(Number);
    const entriesThisMonth = 3 + (monthNum % 3);
    for (let i = 0; i < entriesThisMonth; i += 1) {
      const template = EXPENSE_TEMPLATES[(counter + i) % EXPENSE_TEMPLATES.length]!;
      const submitter = SUBMITTERS[(counter + i) % SUBMITTERS.length]!;
      const yearScale = 1 + (year - 2023) * 0.12;
      const amount = Math.round(template.base * yearScale * (0.85 + (i % 4) * 0.08) * 100) / 100;
      const day = String(Math.min(28, 4 + i * 5)).padStart(2, "0");
      const expenseDate = `${month}-${day}`;
      const dateSubmitted = `${month}-${String(Math.min(28, 6 + i * 5)).padStart(2, "0")}`;
      counter += 1;
      expenses.push({
        id: `nst-exp-${month}-${i}`,
        submitterUserId: submitter.id,
        submitterName: submitter.name,
        purposeDescription: `${template.purpose} — ${month}`,
        amount,
        currency: "GBP",
        dateSubmitted,
        paid: i !== 1 || month < "2026-08",
        supplier: template.supplier,
        categoryAccountCode: template.category,
        expenseDate,
        paymentMethod: i % 2 === 0 ? "Wise" : "Card",
        wiseBalanceId: i % 2 === 0 ? 1 : null,
        attachmentPath: null,
        reference: `NST-${month.replace("-", "")}-${String(counter).padStart(3, "0")}`,
        recordStatus: "finalized",
        reimbursable: template.category === "5080",
        journalEntryId: null,
        paymentJournalEntryId: null,
        createdAt: `${expenseDate}T10:00:00.000Z`,
        updatedAt: NOW,
      });
    }
  }

  return expenses.sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
}

export function getNorthstarExpenses(): FinancialExpense[] {
  if (!cachedNorthstarExpenses) {
    cachedNorthstarExpenses = buildNorthstarExpenseHistory();
  }
  return cachedNorthstarExpenses;
}

export {
  getNorthstarInvoices,
  getNorthstarPayables,
  summarizeNorthstarReceivables,
  summarizeNorthstarPayables,
  NORTHSTAR_COMPLIANCE_FIXTURE,
} from "@/lib/demo/northstar-ap-ar-fixtures";
export type { NorthstarPayableRow, NorthstarPayableCategory } from "@/lib/demo/northstar-ap-ar-fixtures";

export function getNorthstarBoardDirectors(): BoardDirector[] {
  const org = getDemoEnterpriseFixtures().company.tradingName;
  return NORTHSTAR_BOARD_DIRECTORS.map((row, index) => ({
    id: row.id,
    workspaceId: WS,
    fullName: row.name,
    roleTitle: row.role,
    organisation: row.type === "Investor" ? "Northern Tech Ventures" : org,
    email: `${row.name.toLowerCase().replace(/\s+/g, ".")}@northstar.demo`,
    phone: "+44 161 555 0100",
    compensationUsdPerYear: row.type === "Executive" ? null : 25_000,
    sortOrder: index,
    isActive: true,
    notes: `${row.type} director — Northstar board.`,
  }));
}

export function getNorthstarEmployees(): HrEmployee[] {
  const { getNorthstarHrEmployees } = require("./northstar-hr-data") as typeof import("./northstar-hr-data");
  return getNorthstarHrEmployees();
}

export function getNorthstarDemoUsers(): ManagedUser[] {
  const { buildNorthstarDemoUsers } =
    require("./northstar-users-data") as typeof import("./northstar-users-data");
  return buildNorthstarDemoUsers();
}

const emptyCredentials = {
  primaryAccountEmail: "",
  portalUrl: "",
  username: "",
  passwordSet: false,
  mfaEnabled: false,
  recoveryEmail: "",
  recoveryPhone: "",
  notes: "",
};

export function getNorthstarSoftwareAssets(): {
  assets: SoftwareAsset[];
  summary: SoftwareAssetsSummary;
} {
  const rows: Omit<SoftwareAsset, "id" | "workspaceId" | "createdAt" | "updatedAt">[] = [
    {
      name: "AWS Production",
      vendor: "Amazon Web Services",
      purpose: "Cloud infrastructure for Atlas monitoring platform",
      category: "Cloud",
      websiteUrl: "https://aws.amazon.com",
      supportUrl: "",
      documentationUrl: "",
      status: "Active",
      licencesPurchased: 1,
      licencesAllocated: 1,
      licenceType: "Unlimited",
      monthlyCost: 1_070,
      annualCost: 12_840,
      currency: "GBP",
      lastPaymentAmount: 1_070,
      lastPaymentDate: "2026-08-01",
      nextRenewalDate: "2026-09-01",
      renewalFrequency: "Monthly",
      contractLength: "Rolling",
      costCentre: "Engineering",
      budgetOwner: "James Okonkwo",
      supplierName: "Amazon Web Services",
      invoiceReference: "AWS-AUG-2026",
      financialAccountCode: "5010",
      businessOwner: "James Okonkwo",
      technicalOwner: "Sophie Barker",
      department: "Engineering",
      approver: "Elena Hart",
      supplierCompany: "Amazon Web Services",
      accountManager: "",
      supportEmail: "",
      supportPhone: "",
      customerNumber: "",
      integrationConnected: true,
      integrationApiKeySet: true,
      integrationWebhookUrl: "",
      integrationOauthStatus: "connected",
      integrationSyncStatus: "healthy",
      providerSlug: "aws",
      linkedExpenseId: null,
      filesFolderId: null,
      credentials: emptyCredentials,
      files: [],
    },
    {
      name: "GitHub Enterprise",
      vendor: "GitHub",
      purpose: "Source control and CI/CD",
      category: "Development",
      websiteUrl: "https://github.com",
      supportUrl: "",
      documentationUrl: "",
      status: "Active",
      licencesPurchased: 25,
      licencesAllocated: 22,
      licenceType: "Per user",
      monthlyCost: 890,
      annualCost: 10_680,
      currency: "GBP",
      lastPaymentAmount: 890,
      lastPaymentDate: "2026-08-01",
      nextRenewalDate: "2026-09-01",
      renewalFrequency: "Monthly",
      contractLength: "Annual",
      costCentre: "Engineering",
      budgetOwner: "James Okonkwo",
      supplierName: "GitHub",
      invoiceReference: "GH-ENT-AUG",
      financialAccountCode: "5010",
      businessOwner: "James Okonkwo",
      technicalOwner: "James Okonkwo",
      department: "Engineering",
      approver: "Elena Hart",
      supplierCompany: "GitHub",
      accountManager: "",
      supportEmail: "",
      supportPhone: "",
      customerNumber: "",
      integrationConnected: true,
      integrationApiKeySet: true,
      integrationWebhookUrl: "",
      integrationOauthStatus: "connected",
      integrationSyncStatus: "healthy",
      providerSlug: "github",
      linkedExpenseId: null,
      filesFolderId: null,
      credentials: emptyCredentials,
      files: [],
    },
    {
      name: "HubSpot CRM",
      vendor: "HubSpot",
      purpose: "Sales pipeline and marketing automation",
      category: "CRM",
      websiteUrl: "https://hubspot.com",
      supportUrl: "",
      documentationUrl: "",
      status: "Active",
      licencesPurchased: 10,
      licencesAllocated: 8,
      licenceType: "Named",
      monthlyCost: 620,
      annualCost: 7_440,
      currency: "GBP",
      lastPaymentAmount: 620,
      lastPaymentDate: "2026-08-01",
      nextRenewalDate: "2027-08-01",
      renewalFrequency: "Annually",
      contractLength: "12 months",
      costCentre: "Sales",
      budgetOwner: "Marcus Reed",
      supplierName: "HubSpot",
      invoiceReference: "HS-2026",
      financialAccountCode: "5030",
      businessOwner: "Marcus Reed",
      technicalOwner: "Marcus Reed",
      department: "Sales",
      approver: "Elena Hart",
      supplierCompany: "HubSpot",
      accountManager: "",
      supportEmail: "",
      supportPhone: "",
      customerNumber: "",
      integrationConnected: true,
      integrationApiKeySet: false,
      integrationWebhookUrl: "",
      integrationOauthStatus: "connected",
      integrationSyncStatus: "healthy",
      providerSlug: "hubspot",
      linkedExpenseId: null,
      filesFolderId: null,
      credentials: emptyCredentials,
      files: [],
    },
  ];

  const assets: SoftwareAsset[] = rows.map((row, index) => ({
    ...row,
    id: `nst-swa-${index + 1}`,
    workspaceId: WS,
    createdAt: NOW,
    updatedAt: NOW,
  }));

  const summary = computeSoftwareAssetsSummary(assets, 25);
  summary.currency = "GBP";

  return { assets, summary };
}

export function getNorthstarSupportTickets(): SupportTicket[] {
  return [
    {
      id: "nst-tkt-1",
      name: "Tom Bradley",
      organisation: "Sheffield Precision Engineering",
      priority: "high",
      description: "Edge gateway offline at Line 3 — no telemetry since 06:00 BST.",
      userAssigned: "Marcus Reed",
      clientPhone: "+44 114 555 0101",
      clientPriorityLabel: "P1 — Production",
      archived: false,
      closed: false,
      createdAt: "2026-08-16T06:15:00.000Z",
      updatedAt: "2026-08-16T08:30:00.000Z",
      clientId: "nst-cli-sheffield",
      status: "open",
      source: "client_portal",
    },
    {
      id: "nst-tkt-2",
      name: "Daniel Wright",
      organisation: "Peak District Breweries",
      priority: "medium",
      description: "Request dashboard export for fermentation tank monitoring.",
      userAssigned: "Elena Hart",
      clientPhone: "+44 1629 555 012",
      clientPriorityLabel: "Standard",
      archived: false,
      closed: false,
      createdAt: "2026-08-15T14:00:00.000Z",
      updatedAt: "2026-08-15T16:00:00.000Z",
      clientId: "nst-cli-peak",
      status: "in_progress",
      source: "email",
    },
    {
      id: "nst-tkt-3",
      name: "Siân Evans",
      organisation: "Cardiff Port Logistics",
      priority: "low",
      description: "OT network firewall rule change for gateway commissioning.",
      userAssigned: "James Okonkwo",
      clientPhone: "+44 29 2018 4400",
      clientPriorityLabel: "Project",
      archived: false,
      closed: false,
      createdAt: "2026-08-14T09:00:00.000Z",
      updatedAt: "2026-08-14T11:00:00.000Z",
      clientId: "nst-cli-cardiff",
      status: "open",
      source: "phone",
    },
  ];
}

export function getNorthstarCalendarEvents(): CalendarEvent[] {
  return [
    {
      id: "nst-cal-1",
      title: "Sheffield Precision — edge rollout stand-up",
      eventType: "meeting",
      startsAt: "2026-08-18T08:00:00.000Z",
      endsAt: "2026-08-18T08:30:00.000Z",
      clientName: "Sheffield Precision Engineering",
      location: "Video",
      notes: "Weekly delivery sync",
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: "nst-cal-2",
      title: "Board prep — Q3 pack review",
      eventType: "meeting",
      startsAt: "2026-08-20T13:00:00.000Z",
      endsAt: "2026-08-20T14:00:00.000Z",
      clientName: null,
      location: "Manchester HQ",
      notes: "Finance + delivery leads",
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: "nst-cal-3",
      title: "Peak District Breweries — UAT sign-off",
      eventType: "onsite",
      startsAt: "2026-08-22T10:00:00.000Z",
      endsAt: "2026-08-22T15:00:00.000Z",
      clientName: "Peak District Breweries",
      location: "Bakewell, UK",
      notes: "On-site acceptance testing",
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];
}

export function getNorthstarCrmConnections(): CrmConnection[] {
  const uk: Omit<CrmConnection, "id" | "createdAt" | "updatedAt">[] = [
    {
      name: "Helen Marsh",
      role: "Channel Partner",
      specialties: "Industrial automation, PLC integration",
      background: "15 years distributing edge controllers across the North West.",
      countryExperience: "United Kingdom",
      city: "Manchester",
      country: "United Kingdom",
      latitude: 53.4808,
      longitude: -2.2426,
    },
    {
      name: "Chris Palmer",
      role: "Systems Integrator",
      specialties: "OT/IT convergence, predictive maintenance",
      background: "Midlands manufacturing digitalisation programmes.",
      countryExperience: "United Kingdom",
      city: "Birmingham",
      country: "United Kingdom",
      latitude: 52.4862,
      longitude: -1.8904,
    },
    {
      name: "Rachel Owen",
      role: "Industry Advisor",
      specialties: "Food & beverage processing, packaging lines",
      background: "Former operations director at regional F&B group.",
      countryExperience: "United Kingdom",
      city: "Preston",
      country: "United Kingdom",
      latitude: 53.7632,
      longitude: -2.7031,
    },
    {
      name: "Tom Bradley",
      role: "Plant Director",
      specialties: "Precision engineering, CNC monitoring",
      background: "Sheffield Precision Engineering — Northstar anchor client.",
      countryExperience: "United Kingdom",
      city: "Sheffield",
      country: "United Kingdom",
      latitude: 53.3811,
      longitude: -1.4701,
    },
    {
      name: "Siân Evans",
      role: "Operations Lead",
      specialties: "Port logistics, fleet telemetry",
      background: "Cardiff Port Logistics digital transformation sponsor.",
      countryExperience: "United Kingdom",
      city: "Cardiff",
      country: "United Kingdom",
      latitude: 51.4816,
      longitude: -3.1791,
    },
    {
      name: "Daniel Wright",
      role: "Brewery Operations",
      specialties: "Fermentation monitoring, cold chain",
      background: "Peak District Breweries — multi-site OT rollout.",
      countryExperience: "United Kingdom",
      city: "Bakewell",
      country: "United Kingdom",
      latitude: 53.2134,
      longitude: -1.675,
    },
  ];

  const us: Omit<CrmConnection, "id" | "createdAt" | "updatedAt">[] = [
    {
      name: "Marcus Reed",
      role: "US General Manager",
      specialties: "Gulf Coast energy, petrochemical OT",
      background: "Leads Northstar Austin office and US channel partners.",
      countryExperience: "United States",
      city: "Austin",
      country: "United States",
      latitude: 30.2672,
      longitude: -97.7431,
    },
    {
      name: "Laura Chen",
      role: "Systems Integrator",
      specialties: "Semiconductor fab monitoring",
      background: "Texas industrial automation integrator network.",
      countryExperience: "United States",
      city: "Dallas",
      country: "United States",
      latitude: 32.7767,
      longitude: -96.797,
    },
    {
      name: "Mike Sullivan",
      role: "Channel Partner",
      specialties: "Midwest manufacturing, PLC retrofits",
      background: "Chicago-area distributor for edge controllers.",
      countryExperience: "United States",
      city: "Chicago",
      country: "United States",
      latitude: 41.8781,
      longitude: -87.6298,
    },
    {
      name: "Jennifer Park",
      role: "Industry Advisor",
      specialties: "Automotive supply chain, Andon systems",
      background: "Former plant manager at tier-1 automotive supplier.",
      countryExperience: "United States",
      city: "Detroit",
      country: "United States",
      latitude: 42.3314,
      longitude: -83.0458,
    },
    {
      name: "Robert Hayes",
      role: "Energy Sector Lead",
      specialties: "Upstream monitoring, pipeline SCADA",
      background: "Houston energy corridor OT modernisation programmes.",
      countryExperience: "United States",
      city: "Houston",
      country: "United States",
      latitude: 29.7604,
      longitude: -95.3698,
    },
    {
      name: "Amanda Foster",
      role: "Food Processing",
      specialties: "Cold storage, HACCP telemetry",
      background: "US F&B plant operations and compliance.",
      countryExperience: "United States",
      city: "Atlanta",
      country: "United States",
      latitude: 33.749,
      longitude: -84.388,
    },
    {
      name: "Kevin O'Brien",
      role: "Logistics Director",
      specialties: "Warehouse automation, AGV fleets",
      background: "East coast 3PL digitalisation lead.",
      countryExperience: "United States",
      city: "Newark",
      country: "United States",
      latitude: 40.7357,
      longitude: -74.1724,
    },
    {
      name: "Sarah Mitchell",
      role: "Pharma Compliance",
      specialties: "GMP batch monitoring, cleanroom OT",
      background: "New Jersey pharma manufacturing validation.",
      countryExperience: "United States",
      city: "Princeton",
      country: "United States",
      latitude: 40.3573,
      longitude: -74.6672,
    },
    {
      name: "David Kim",
      role: "Tech Partner",
      specialties: "Cloud edge gateways, Azure IoT",
      background: "Pacific Northwest cloud integration partner.",
      countryExperience: "United States",
      city: "Seattle",
      country: "United States",
      latitude: 47.6062,
      longitude: -122.3321,
    },
    {
      name: "Patricia Gomez",
      role: "Mining & Metals",
      specialties: "Heavy industry, remote asset monitoring",
      background: "Rocky Mountain metals processing OT programmes.",
      countryExperience: "United States",
      city: "Denver",
      country: "United States",
      latitude: 39.7392,
      longitude: -104.9903,
    },
  ];

  return [...uk, ...us].map((row, index) => ({
    ...row,
    id: `nst-conn-${index + 1}`,
    createdAt: NOW,
    updatedAt: NOW,
  }));
}

export function getNorthstarExternalUsers() {
  const clients = [
    { id: "nst-cli-sheffield", org: "Sheffield Precision Engineering", name: "Tom Bradley" },
    { id: "nst-cli-peak", org: "Peak District Breweries", name: "Daniel Wright" },
    { id: "nst-cli-cardiff", org: "Cardiff Port Logistics", name: "Siân Evans" },
    { id: "nst-cli-manchester", org: "Trafford Packaging Ltd", name: "Helen Marsh" },
    { id: "nst-cli-bristol", org: "Avon Composites", name: "James Okonkwo" },
    { id: "nst-cli-nottingham", org: "Nottingham Automation Group", name: "Chris Palmer" },
    { id: "nst-cli-lancashire", org: "Lancashire Packaging Systems", name: "Rachel Owen" },
    { id: "nst-cli-birmingham", org: "Midlands Steel Fabrication", name: "Priya Shah" },
    { id: "nst-cli-leeds", org: "Yorkshire Food Processing", name: "Oliver Grant" },
    { id: "nst-cli-austin", org: "Lone Star Industrial", name: "Marcus Reed" },
    { id: "nst-cli-houston", org: "Gulf Coast Energy Services", name: "Robert Hayes" },
    { id: "nst-cli-chicago", org: "Lakefront Manufacturing", name: "Mike Sullivan" },
  ];

  return clients.map((client, index) => ({
    id: `nst-ext-${index + 1}`,
    name: client.name,
    organisation: client.org,
    clientId: client.id,
    username: client.name.toLowerCase().replace(/\s+/g, ".").replace("'", ""),
    email: `${client.name.toLowerCase().replace(/\s+/g, ".").replace("'", "")}@${client.org.toLowerCase().replace(/\s+/g, "").slice(0, 12)}.demo`,
    lastLoggedIn: index % 3 === 0 ? "2026-08-15T14:30:00.000Z" : "2026-08-10T09:00:00.000Z",
    isActive: index !== 5,
    redirectPath: "/client/portal",
    createdAt: "2026-06-01T10:00:00.000Z",
  }));
}

export function getNorthstarOnboardingQuestionnaire(recordId: string) {
  const records: Record<
    string,
    {
      organisationName: string;
      logoPath: string | null;
      completedAt: string | null;
      moduleSelectionMode: "all" | "choose";
      selectedModuleLabels: string[];
      importClientsCsv: boolean;
    }
  > = {
    "nst-onb-001": {
      organisationName: "Lancashire Packaging Systems",
      logoPath: null,
      completedAt: "2026-08-10T16:30:00.000Z",
      moduleSelectionMode: "choose",
      selectedModuleLabels: ["Monitoring", "Alerts", "Reporting"],
      importClientsCsv: true,
    },
    "nst-onb-002": {
      organisationName: "Nottingham Automation Group",
      logoPath: null,
      completedAt: "2026-07-28T10:00:00.000Z",
      moduleSelectionMode: "all",
      selectedModuleLabels: ["Full platform suite"],
      importClientsCsv: false,
    },
  };
  return records[recordId] ?? null;
}

export function getNorthstarOnboardingPaymentReceipt(recordId: string) {
  const receipts: Record<string, { url: string; name: string }> = {
    "nst-onb-001": {
      url: "https://northstar.demo/receipts/lancashire-packaging-aug-2026.pdf",
      name: "Lancashire Packaging — onboarding payment.pdf",
    },
    "nst-onb-002": {
      url: "https://northstar.demo/receipts/nottingham-auto-jul-2026.pdf",
      name: "Nottingham Automation — onboarding payment.pdf",
    },
  };
  return receipts[recordId] ?? null;
}

export function getNorthstarMarketingKpis(): MarketingDashboardKpis {
  return {
    newsletterOpenRate: 42.5,
    sentNewsletterCount: 6,
    mailingSubscribers: 2_840,
    mailingGrowth30d: 186,
    externalEventsConfirmed: 3,
    externalEventsTotal: 4,
    managedEventRegistered: 48,
    managedEventCapacity: 60,
    managedEventCount: 2,
  };
}
