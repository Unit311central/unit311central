/**
 * SAEC-only Business Central / Home fixtures (static overlays).
 * South African elevator & escalator client relationships — never Northstar demo rows.
 */

import type { ManagedClient } from "@/lib/client-management-data";
import type { InternalProject } from "@/lib/projects-data";
import { isBrowserSaecSurface, isSaecSlug, SAEC_COMPANY_NAME } from "@/lib/saec-surface";

const FIXTURE_NOW = "2026-08-01T12:00:00.000Z";

function client(partial: Omit<ManagedClient, "createdAt" | "updatedAt">): ManagedClient {
  return { ...partial, createdAt: FIXTURE_NOW, updatedAt: FIXTURE_NOW };
}

function project(
  partial: Omit<InternalProject, "createdAt" | "updatedAt">,
): InternalProject {
  return { ...partial, createdAt: FIXTURE_NOW, updatedAt: FIXTURE_NOW };
}

const SAEC_CLIENTS: ManagedClient[] = [
  client({
    id: "saec-cli-growthpoint",
    companyName: "Growthpoint Properties",
    industry: "Property & Heritage",
    primaryContact: "Thabo Mokoena",
    email: "facilities@growthpoint.co.za",
    phone: "+27 11 944 6500",
    region: "Other",
    accountStatus: "Active",
    contractType: "Framework Agreement",
    taxId: "ZA4123456789",
    billingAddress: "The Place, 1 Sandton Drive, Sandton 2196",
    activeProjects: 1,
    notes: `${SAEC_COMPANY_NAME} vertical transport modernisation portfolio.`,
  }),
  client({
    id: "saec-cli-redefine",
    companyName: "Redefine Properties",
    industry: "Property & Heritage",
    primaryContact: "Lerato Nkosi",
    email: "ops@redefine.co.za",
    phone: "+27 11 643 1800",
    region: "Other",
    accountStatus: "Active",
    contractType: "Framework Agreement",
    taxId: "ZA4987654321",
    billingAddress: "Rosebank, Johannesburg",
    activeProjects: 1,
    notes: "Escalator and lift maintenance across retail portfolio.",
  }),
  client({
    id: "saec-cli-hyprop",
    companyName: "Hyprop Investments",
    industry: "Property & Heritage",
    primaryContact: "Pieter van der Merwe",
    email: "technical@hyprop.co.za",
    phone: "+27 11 447 9260",
    region: "Other",
    accountStatus: "Active",
    contractType: "Retainer",
    taxId: "ZA4556677889",
    billingAddress: "Hyprop House, Hyde Park, Johannesburg",
    activeProjects: 1,
    notes: "Centurion Mall and regional mall lift programme.",
  }),
  client({
    id: "saec-cli-va-waterfront",
    companyName: "V&A Waterfront",
    industry: "Property & Heritage",
    primaryContact: "Sarah Daniels",
    email: "engineering@waterfront.co.za",
    phone: "+27 21 408 7600",
    region: "Other",
    accountStatus: "Active",
    contractType: "Project-based",
    taxId: "ZA4332211100",
    billingAddress: "Dock Road, Cape Town 8001",
    activeProjects: 1,
    notes: "Public escalator and lift upgrade at waterfront precinct.",
  }),
  client({
    id: "saec-cli-killarney",
    companyName: "Killarney Mall",
    industry: "Property & Heritage",
    primaryContact: "David Khumalo",
    email: "centre.manager@killarneymall.co.za",
    phone: "+27 11 646 1024",
    region: "Other",
    accountStatus: "Active",
    contractType: "Project-based",
    taxId: "ZA4778899001",
    billingAddress: "60 Riviera Road, Killarney, Johannesburg",
    activeProjects: 1,
    notes: "Escalator modernisation — CANNY commercial units.",
  }),
  client({
    id: "saec-cli-brooklyn",
    companyName: "Brooklyn Mall",
    industry: "Property & Heritage",
    primaryContact: "Nomsa Dlamini",
    email: "facilities@brooklynmall.co.za",
    phone: "+27 12 460 0700",
    region: "Other",
    accountStatus: "Active",
    contractType: "Retainer",
    taxId: "ZA4665544332",
    billingAddress: "Cnr Veale & Fehrsen Streets, Brooklyn, Pretoria",
    activeProjects: 1,
    notes: "Comprehensive maintenance and repair contract.",
  }),
  client({
    id: "saec-cli-emperors",
    companyName: "Emperors Palace",
    industry: "Property & Heritage",
    primaryContact: "Johan Steyn",
    email: "maintenance@emperorspalace.com",
    phone: "+27 11 928 1600",
    region: "Other",
    accountStatus: "Active",
    contractType: "Project-based",
    taxId: "ZA4889900112",
    billingAddress: "64 Jones Road, Kempton Park",
    activeProjects: 1,
    notes: "Escalator replacement in hospitality precinct.",
  }),
  client({
    id: "saec-cli-nedbank",
    companyName: "Nedbank Polokwane",
    industry: "Infrastructure",
    primaryContact: "Mpho Sebata",
    email: "branch.facilities@nedbank.co.za",
    phone: "+27 15 291 8500",
    region: "Other",
    accountStatus: "Active",
    contractType: "Retainer",
    taxId: "ZA4112233445",
    billingAddress: "78 Hans van Rensburg Street, Polokwane",
    activeProjects: 0,
    notes: "Lift service and compliance inspections.",
  }),
];

const SAEC_PROJECTS: InternalProject[] = [
  project({
    id: "saec-prj-killarney-mod",
    name: "Killarney Mall escalator modernisation",
    clientId: "saec-cli-killarney",
    clientName: "Killarney Mall",
    site: "Johannesburg, Gauteng",
    region: "Gauteng",
    operator: "Sipho Maseko",
    phase: "live",
    startDate: "2025-09-01",
    endDate: "2026-11-30",
    progressPct: 72,
    notes: "CANNY commercial escalators — Phase 2 commissioning.",
  }),
  project({
    id: "saec-prj-va-upgrade",
    name: "V&A Waterfront lift upgrade programme",
    clientId: "saec-cli-va-waterfront",
    clientName: "V&A Waterfront",
    site: "Cape Town, Western Cape",
    region: "Western Cape",
    operator: "Annelize Fourie",
    phase: "live",
    startDate: "2025-06-15",
    endDate: "2026-10-31",
    progressPct: 58,
    notes: "KLK lift range installation — public access compliance.",
  }),
  project({
    id: "saec-prj-brooklyn-maint",
    name: "Brooklyn Mall maintenance contract",
    clientId: "saec-cli-brooklyn",
    clientName: "Brooklyn Mall",
    site: "Pretoria, Gauteng",
    region: "Gauteng",
    operator: "Tshepo Modise",
    phase: "live",
    startDate: "2024-01-01",
    endDate: "2027-12-31",
    progressPct: 85,
    notes: "Annual maintenance and repair SLA.",
  }),
  project({
    id: "saec-prj-ponte",
    name: "Ponte City high-rise modernisation",
    clientId: "saec-cli-growthpoint",
    clientName: "Growthpoint Properties",
    site: "Johannesburg, Gauteng",
    region: "Gauteng",
    operator: "Riaan Pretorius",
    phase: "live",
    startDate: "2025-03-01",
    endDate: "2026-12-15",
    progressPct: 61,
    notes: "52-storey lift upgrade — SAEC technical competency showcase.",
  }),
  project({
    id: "saec-prj-centurion",
    name: "Centurion Mall KLK installation",
    clientId: "saec-cli-hyprop",
    clientName: "Hyprop Investments",
    site: "Centurion, Gauteng",
    region: "Gauteng",
    operator: "Linda van Wyk",
    phase: "upcoming",
    startDate: "2026-10-01",
    endDate: "2027-06-30",
    progressPct: 12,
    notes: "New installation — 450kg through 2000kg KLK range.",
  }),
  project({
    id: "saec-prj-emperors",
    name: "Emperors Palace escalator replacement",
    clientId: "saec-cli-emperors",
    clientName: "Emperors Palace",
    site: "Kempton Park, Gauteng",
    region: "Gauteng",
    operator: "Francois du Plessis",
    phase: "live",
    startDate: "2025-11-01",
    endDate: "2026-09-30",
    progressPct: 48,
    notes: "Public escalator replacement — weekend outage windows.",
  }),
  project({
    id: "saec-prj-nedbank",
    name: "Nedbank Polokwane lift service",
    clientId: "saec-cli-nedbank",
    clientName: "Nedbank Polokwane",
    site: "Polokwane, Limpopo",
    region: "Limpopo",
    operator: "Kagiso Mohapi",
    phase: "completed",
    startDate: "2024-06-01",
    endDate: "2025-05-31",
    progressPct: 100,
    notes: "Completed — annual compliance certification renewed.",
  }),
  project({
    id: "saec-prj-redefine",
    name: "Redefine portfolio lift audit",
    clientId: "saec-cli-redefine",
    clientName: "Redefine Properties",
    site: "Johannesburg, Gauteng",
    region: "Gauteng",
    operator: "Zanele Mthembu",
    phase: "live",
    startDate: "2025-08-01",
    endDate: "2026-08-31",
    progressPct: 67,
    notes: "Portfolio-wide condition assessment and remediation plan.",
  }),
];

/** True when fixtures should overlay live reads (browser or slug). */
export function isSaecBusinessCentralFixtures(slug?: string | null): boolean {
  if (isSaecSlug(slug)) return true;
  return isBrowserSaecSurface();
}

export function getSaecFixtureClients(): ManagedClient[] {
  return SAEC_CLIENTS.map((row) => ({ ...row }));
}

export function getSaecFixtureProjects(): InternalProject[] {
  return SAEC_PROJECTS.map((row) => ({ ...row }));
}
