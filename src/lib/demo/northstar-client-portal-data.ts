/**
 * Northstar demo client portal — Sheffield Precision Engineering programme data.
 * Uses the same section ids as OnwardAir client portals for shared shell/nav.
 */
import type {
  OaPortalAircraft,
  OaPortalDocument,
  OaPortalKpi,
  OaPortalMission,
  OaPortalSupportTicket,
} from "@/lib/onwardair/client-portal-data";
import { getNorthstarInvoices } from "@/lib/demo/northstar-ap-ar-fixtures";
import type { LedgerInvoice } from "@/lib/accounting/types";

export type NorthstarClientPortalSection =
  | "dashboard"
  | "projects"
  | "milestones"
  | "documents"
  | "invoices"
  | "support";

export type NorthstarClientNavItem = {
  id: NorthstarClientPortalSection;
  label: string;
  hrefSuffix: string;
};

export type NorthstarClientNavGroup = {
  id: string;
  label: string | null;
  items: NorthstarClientNavItem[];
};

export const NORTHSTAR_CLIENT_PORTAL_NAV: readonly NorthstarClientNavGroup[] = [
  {
    id: "home",
    label: null,
    items: [{ id: "dashboard", label: "Programme Dashboard", hrefSuffix: "" }],
  },
  {
    id: "programme",
    label: "Programme",
    items: [
      { id: "projects", label: "Active Projects", hrefSuffix: "/projects" },
      { id: "milestones", label: "Milestones", hrefSuffix: "/milestones" },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { id: "documents", label: "Documents", hrefSuffix: "/documents" },
      { id: "invoices", label: "Invoices", hrefSuffix: "/invoices" },
      { id: "support", label: "Support", hrefSuffix: "/support" },
    ],
  },
] as const;

export function northstarClientPortalHref(companyPath: string, hrefSuffix: string) {
  return `/${companyPath}${hrefSuffix}`;
}

export function parseNorthstarClientPortalSection(
  section: string[] | undefined,
): NorthstarClientPortalSection | null {
  if (!section?.length) return "dashboard";
  const key = section[0]?.toLowerCase();
  if (key === "projects" || key === "fleet") return "projects";
  if (key === "milestones" || key === "missions") return "milestones";
  if (key === "documents") return "documents";
  if (key === "invoices") return "invoices";
  if (key === "support") return "support";
  if (key === "dashboard") return "dashboard";
  return null;
}

export function northstarSectionToAppSection(
  section: NorthstarClientPortalSection,
): "dashboard" | "fleet" | "missions" | "documents" | "support" | "invoices" {
  if (section === "projects") return "fleet";
  if (section === "milestones") return "missions";
  return section;
}

const SHEFFIELD_CLIENT_NAME = "Sheffield Precision Engineering";

export function getSheffieldPortalInvoices(): LedgerInvoice[] {
  return getNorthstarInvoices().filter((row) => row.clientName === SHEFFIELD_CLIENT_NAME);
}

function formatGbp(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function summarizeSheffieldPortalInvoices(invoices: LedgerInvoice[]) {
  const unpaid = invoices.filter((row) => row.status === "issued" || row.status === "overdue");
  const outstanding = unpaid.reduce((sum, row) => sum + row.amount, 0);
  return {
    outstanding,
    outstandingLabel: formatGbp(outstanding),
    unpaidCount: unpaid.length,
    paidCount: invoices.filter((row) => row.status === "paid").length,
    rows: invoices.slice(0, 12),
  };
}

export function getSheffieldPortalData() {
  const kpis: OaPortalKpi[] = [
    { id: "k1", label: "Edge gateways", value: "12", hint: "Line 3 + Line 7 deployed" },
    { id: "k2", label: "Live assets", value: "148", hint: "Monitored PLCs & drives" },
    { id: "k3", label: "Open alerts", value: "3", hint: "2 informational · 1 watch" },
    { id: "k4", label: "Uptime (30d)", value: "99.2%", hint: "Atlas monitoring platform" },
  ];

  const aircraft: OaPortalAircraft[] = [
    {
      id: "site-1",
      name: "Atlas Line 3 — CNC cell",
      type: "Edge gateway cluster",
      status: "Flight ready",
      location: "Sheffield Atlas Works",
      utilizationPct: 78,
      nextEvent: "Firmware v2.4 rollout — 22 Aug",
    },
    {
      id: "site-2",
      name: "Atlas Line 7 — assembly",
      type: "OPC-UA bridge",
      status: "Demo configured",
      location: "Sheffield Atlas Works",
      utilizationPct: 64,
      nextEvent: "UAT sign-off review — 15 Mar",
    },
  ];

  const missions: OaPortalMission[] = [
    {
      id: "m1",
      name: "Phase 2 gateway deployment",
      corridor: "Line 3 production hall",
      payload: "12 edge nodes",
      status: "Scheduled",
      date: "22 Aug 2026",
      aircraft: "Atlas Edge v3",
    },
    {
      id: "m2",
      name: "Predictive maintenance pilot",
      corridor: "Spindle monitoring",
      payload: "Vibration baselines",
      status: "Planning",
      date: "Sep 2026",
      aircraft: "Atlas ML pipeline",
    },
    {
      id: "m3",
      name: "UAT sign-off workshop",
      corridor: "Executive review",
      payload: "Go-live pack",
      status: "Scheduled",
      date: "15 Mar 2026",
      aircraft: "Programme office",
    },
  ];

  const documents: OaPortalDocument[] = [
    { id: "d1", title: "NST_SOW_Sheffield_v3.pdf", kind: "Statement of work", updatedAt: "12 Aug 2026" },
    { id: "d2", title: "Atlas UAT test plan", kind: "UAT", updatedAt: "5 Aug 2026" },
    { id: "d3", title: "Edge gateway architecture", kind: "Technical", updatedAt: "28 Jul 2026" },
    { id: "d4", title: "Monthly executive QBR — Jul", kind: "Report", updatedAt: "31 Jul 2026" },
  ];

  const tickets: OaPortalSupportTicket[] = [
    {
      id: "t1",
      subject: "Line 3 gateway heartbeat intermittent",
      status: "Open",
      updatedAt: "16 Aug 2026",
    },
    {
      id: "t2",
      subject: "Request OPC-UA tag export for Line 7",
      status: "Waiting",
      updatedAt: "14 Aug 2026",
    },
    {
      id: "t3",
      subject: "QBR pack — August metrics",
      status: "Resolved",
      updatedAt: "10 Aug 2026",
    },
  ];

  const programmeNotes = [
    "Atlas Monitoring Platform go-live targeted for Q1 2026 after UAT sign-off.",
    "Northstar programme lead Marcus Reed — weekly steering on Wednesdays.",
    "Edge controller v3 certification testing on track for Q2 2026.",
  ];

  return { kpis, aircraft, missions, documents, tickets, programmeNotes };
}
