/**
 * Hyprop Investments client portal — customer service demo data (ZAR).
 */

import { SAEC_REPORTING_CURRENCY } from "@/lib/saec-surface";

export type OtClientPortalSection =
  | "dashboard"
  | "installations"
  | "equipment"
  | "maintenance"
  | "service"
  | "issues"
  | "documents"
  | "contact";

export const OT_HYPROP_NAV: {
  id: OtClientPortalSection;
  label: string;
  href: string;
}[] = [
  { id: "dashboard", label: "Overview", href: "/hyprop" },
  { id: "installations", label: "Installations", href: "/hyprop/installations" },
  { id: "equipment", label: "Equipment", href: "/hyprop/equipment" },
  { id: "maintenance", label: "Maintenance", href: "/hyprop/maintenance" },
  { id: "service", label: "Service requests", href: "/hyprop/service" },
  { id: "issues", label: "Open issues", href: "/hyprop/issues" },
  { id: "documents", label: "Documents", href: "/hyprop/documents" },
  { id: "contact", label: "Contact", href: "/hyprop/contact" },
];

export type OtClientInstallation = {
  id: string;
  name: string;
  city: string;
  units: number;
  elevators: number;
  escalators: number;
  status: string;
};

export type OtClientEquipment = {
  id: string;
  assetId: string;
  type: "Elevator" | "Escalator";
  model: string;
  location: string;
  status: string;
  lastService: string;
};

export type OtClientServiceRow = {
  id: string;
  reference: string;
  title: string;
  site: string;
  status: string;
  scheduled: string;
  priority: string;
};

export type OtClientIssue = {
  id: string;
  reference: string;
  title: string;
  site: string;
  severity: string;
  status: string;
  reported: string;
};

export type OtClientDocument = {
  id: string;
  title: string;
  category: string;
  updated: string;
};

export const OT_HYPROP_PORTAL = {
  clientName: "Hyprop Investments",
  accountManager: "Pieter van der Merwe",
  accountEmail: "technical@hyprop.co.za",
  accountPhone: "+27 11 447 9260",
  serviceDesk: "support@omnitransit.com",
  servicePhone: "+27 11 234 5600",
  currency: SAEC_REPORTING_CURRENCY,
  contractType: "Retainer — national mall portfolio",
  slaResponse: "4 hours (critical) · 24 hours (standard)",
};

export const OT_HYPROP_INSTALLATIONS: OtClientInstallation[] = [
  {
    id: "ot-hy-i-1",
    name: "Centurion Mall",
    city: "Centurion, Gauteng",
    units: 14,
    elevators: 8,
    escalators: 6,
    status: "Active service",
  },
  {
    id: "ot-hy-i-2",
    name: "Hyde Park Corner",
    city: "Sandton, Gauteng",
    units: 11,
    elevators: 7,
    escalators: 4,
    status: "Active service",
  },
  {
    id: "ot-hy-i-3",
    name: "Rosebank Mall",
    city: "Rosebank, Gauteng",
    units: 9,
    elevators: 5,
    escalators: 4,
    status: "Modernisation in progress",
  },
  {
    id: "ot-hy-i-4",
    name: "Canal Walk",
    city: "Cape Town, Western Cape",
    units: 12,
    elevators: 6,
    escalators: 6,
    status: "Active service",
  },
];

export const OT_HYPROP_EQUIPMENT: OtClientEquipment[] = [
  {
    id: "ot-hy-e-1",
    assetId: "OT-ELV-4412",
    type: "Elevator",
    model: "KLK 630 kg passenger",
    location: "Centurion Mall — North tower",
    status: "Operational",
    lastService: "2026-07-28",
  },
  {
    id: "ot-hy-e-2",
    assetId: "OT-ESC-2208",
    type: "Escalator",
    model: "CANNY commercial escalator",
    location: "Centurion Mall — Main court",
    status: "Scheduled maintenance",
    lastService: "2026-08-05",
  },
  {
    id: "ot-hy-e-3",
    assetId: "OT-ELV-3891",
    type: "Elevator",
    model: "Sigma high-rise passenger",
    location: "Hyde Park Corner — Office wing",
    status: "Operational",
    lastService: "2026-07-15",
  },
  {
    id: "ot-hy-e-4",
    assetId: "OT-ESC-1987",
    type: "Escalator",
    model: "CANNY heavy-duty retail",
    location: "Rosebank Mall — Parking link",
    status: "Technician assigned",
    lastService: "2026-06-30",
  },
];

export const OT_HYPROP_UPCOMING_MAINTENANCE: OtClientServiceRow[] = [
  {
    id: "ot-hy-m-1",
    reference: "SR-2026-8841",
    title: "Quarterly escalator step chain inspection",
    site: "Centurion Mall",
    status: "Scheduled",
    scheduled: "2026-08-30",
    priority: "Standard",
  },
  {
    id: "ot-hy-m-2",
    reference: "SR-2026-8820",
    title: "Lift door operator adjustment",
    site: "Hyde Park Corner",
    status: "Engineer confirmed",
    scheduled: "2026-08-28",
    priority: "Standard",
  },
  {
    id: "ot-hy-m-3",
    reference: "SR-2026-8795",
    title: "Modernisation milestone — controller upgrade",
    site: "Rosebank Mall",
    status: "Planning",
    scheduled: "2026-09-05",
    priority: "Project",
  },
];

export const OT_HYPROP_OPEN_ISSUES: OtClientIssue[] = [
  {
    id: "ot-hy-is-1",
    reference: "INC-2026-1142",
    title: "Intermittent levelling at north passenger lift",
    site: "Centurion Mall",
    severity: "Medium",
    status: "Engineer on site",
    reported: "2026-08-22",
  },
  {
    id: "ot-hy-is-2",
    reference: "INC-2026-1128",
    title: "Escalator handrail speed variance",
    site: "Canal Walk",
    severity: "Low",
    status: "Parts ordered",
    reported: "2026-08-19",
  },
];

export const OT_HYPROP_RECENT_SERVICE: OtClientServiceRow[] = [
  {
    id: "ot-hy-r-1",
    reference: "SR-2026-8710",
    title: "Emergency call-out — stuck passenger resolved",
    site: "Centurion Mall",
    status: "Completed",
    scheduled: "2026-08-12",
    priority: "Critical",
  },
  {
    id: "ot-hy-r-2",
    reference: "SR-2026-8654",
    title: "Monthly preventative maintenance — lifts 3–5",
    site: "Hyde Park Corner",
    status: "Completed",
    scheduled: "2026-08-08",
    priority: "Standard",
  },
];

export const OT_HYPROP_DOCUMENTS: OtClientDocument[] = [
  {
    id: "ot-hy-d-1",
    title: "Service level agreement (FY2026)",
    category: "Contract",
    updated: "2026-03-01",
  },
  {
    id: "ot-hy-d-2",
    title: "Centurion Mall — equipment register",
    category: "Technical",
    updated: "2026-07-15",
  },
  {
    id: "ot-hy-d-3",
    title: "Q2 2026 maintenance performance report",
    category: "Reporting",
    updated: "2026-07-31",
  },
];

export function formatOtZar(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: SAEC_REPORTING_CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const OT_HYPROP_DASHBOARD_KPIS = {
  activeInstallations: OT_HYPROP_INSTALLATIONS.length,
  totalUnits: OT_HYPROP_INSTALLATIONS.reduce((sum, row) => sum + row.units, 0),
  openIssues: OT_HYPROP_OPEN_ISSUES.length,
  upcomingMaintenance: OT_HYPROP_UPCOMING_MAINTENANCE.length,
  ytdServiceSpend: formatOtZar(4_850_000),
};

export function parseOtClientPortalSection(
  path: string,
  section: string[] | undefined,
): OtClientPortalSection | null {
  const route = getOmnitransitClientPortalByPath(path);
  if (!route) return null;
  if (!section?.length) return "dashboard";
  const key = section[0]?.toLowerCase();
  if (key === "dashboard") return "dashboard";
  if (key === "installations" || key === "sites") return "installations";
  if (key === "equipment" || key === "assets") return "equipment";
  if (key === "maintenance") return "maintenance";
  if (key === "service" || key === "requests") return "service";
  if (key === "issues") return "issues";
  if (key === "documents" || key === "docs") return "documents";
  if (key === "contact") return "contact";
  return null;
}

function getOmnitransitClientPortalByPath(path: string): { path: string } | null {
  const normalized = path.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
  if (normalized === "hyprop") return { path: "hyprop" };
  return null;
}
