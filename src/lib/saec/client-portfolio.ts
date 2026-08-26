/**
 * OmniTransit demo client portfolio — ~250 active relationships aligned with ~800 installations.
 */

import type { ManagedClient } from "@/lib/client-management-data";
import { SAEC_COMPANY_NAME } from "@/lib/saec-surface";

export const SAEC_DEMO_CLIENT_COUNT = 250;

const FIXTURE_NOW = "2026-08-01T12:00:00.000Z";

const SA_REGIONS = [
  "Gauteng, South Africa",
  "Western Cape, South Africa",
  "Limpopo, South Africa",
] as const satisfies readonly ManagedClient["region"][];

const SA_INDUSTRIES = [
  "Property & Heritage",
  "Construction",
  "Infrastructure",
  "Government & Public",
  "Logistics & Ports",
  "Energy & Utilities",
  "Mining & Resources",
  "Other",
] as const satisfies readonly ManagedClient["industry"][];

const SA_FIRST_NAMES = [
  "Thabo",
  "Lerato",
  "Pieter",
  "Nomsa",
  "Sipho",
  "Annelize",
  "Bongani",
  "Nadia",
  "Johan",
  "Zanele",
  "Tshepo",
  "Aisha",
  "David",
  "Elaine",
  "Mpho",
  "Chris",
  "Helen",
  "James",
  "Sarah",
  "Lindiwe",
] as const;

const SA_LAST_NAMES = [
  "Mokoena",
  "Nkosi",
  "van der Merwe",
  "Dlamini",
  "Ndlovu",
  "Fourie",
  "Cele",
  "Govender",
  "Steyn",
  "Mthembu",
  "Modise",
  "Khan",
  "Khumalo",
  "Naidoo",
  "Marsh",
  "Okonkwo",
  "Daniels",
  "Sebata",
  "Pretorius",
  "Baloyi",
] as const;

const SA_CITIES = [
  "Johannesburg",
  "Sandton",
  "Pretoria",
  "Centurion",
  "Cape Town",
  "Durban",
  "Port Elizabeth",
  "Bloemfontein",
  "Polokwane",
  "Nelspruit",
  "Rustenburg",
  "Kimberley",
] as const;

const SA_PROPERTY_PREFIXES = [
  "Mall",
  "Centre",
  "Towers",
  "Plaza",
  "Office Park",
  "Hospital",
  "Hotel",
  "Station",
  "Campus",
  "Precinct",
] as const;

const SA_PROPERTY_NAMES = [
  "Hyprop",
  "Growthpoint",
  "Redefine",
  "Netcare",
  "Pick n Pay",
  "Woolworths",
  "Momentum",
  "Discovery",
  "Sun International",
  "Tsogo",
  "Shoprite",
  "Mediclinic",
  "Emperors",
  "Eastgate",
  "Menlyn",
  "Canal Walk",
  "Gateway",
  "Sandton City",
  "Rosebank",
  "Brooklyn",
] as const;

const CONTRACT_TYPES: ManagedClient["contractType"][] = [
  "Framework Agreement",
  "Retainer",
  "Project-based",
  "Trial",
];

const ACCOUNT_STATUSES: ManagedClient["accountStatus"][] = [
  "Active",
  "Active",
  "Active",
  "Active",
  "Onboarding",
  "Dormant",
];

function client(partial: Omit<ManagedClient, "createdAt" | "updatedAt">): ManagedClient {
  return { ...partial, createdAt: FIXTURE_NOW, updatedAt: FIXTURE_NOW };
}

/** Anchor clients — recognisable South African property / infrastructure names. */
export const SAEC_ANCHOR_CLIENTS: ManagedClient[] = [
  client({
    id: "saec-cli-growthpoint",
    companyName: "Growthpoint Properties",
    industry: "Property & Heritage",
    primaryContact: "Thabo Mokoena",
    email: "facilities@growthpoint.co.za",
    phone: "+27 11 944 6500",
    region: "Gauteng, South Africa",
    accountStatus: "Active",
    contractType: "Framework Agreement",
    taxId: "ZA4123456789",
    billingAddress: "The Place, 1 Sandton Drive, Sandton 2196",
    activeProjects: 3,
    notes: `${SAEC_COMPANY_NAME} vertical transport modernisation portfolio.`,
  }),
  client({
    id: "saec-cli-redefine",
    companyName: "Redefine Properties",
    industry: "Property & Heritage",
    primaryContact: "Lerato Nkosi",
    email: "ops@redefine.co.za",
    phone: "+27 11 643 1800",
    region: "Gauteng, South Africa",
    accountStatus: "Active",
    contractType: "Framework Agreement",
    taxId: "ZA4987654321",
    billingAddress: "Rosebank, Johannesburg",
    activeProjects: 2,
    notes: "Escalator and lift maintenance across retail portfolio.",
  }),
  client({
    id: "saec-cli-hyprop",
    companyName: "Hyprop Investments",
    industry: "Property & Heritage",
    primaryContact: "Pieter van der Merwe",
    email: "technical@hyprop.co.za",
    phone: "+27 11 447 9260",
    region: "Gauteng, South Africa",
    accountStatus: "Active",
    contractType: "Retainer",
    taxId: "ZA4556677889",
    billingAddress: "Hyprop House, Hyde Park, Johannesburg",
    activeProjects: 2,
    notes: "Centurion Mall and regional mall lift programme.",
  }),
  client({
    id: "saec-cli-va-waterfront",
    companyName: "V&A Waterfront",
    industry: "Property & Heritage",
    primaryContact: "Sarah Daniels",
    email: "engineering@waterfront.co.za",
    phone: "+27 21 408 7600",
    region: "Western Cape, South Africa",
    accountStatus: "Active",
    contractType: "Project-based",
    taxId: "ZA4332211100",
    billingAddress: "Dock Road, Cape Town 8001",
    activeProjects: 2,
    notes: "Public escalator and lift upgrade at waterfront precinct.",
  }),
  client({
    id: "saec-cli-killarney",
    companyName: "Killarney Mall",
    industry: "Property & Heritage",
    primaryContact: "David Khumalo",
    email: "centre.manager@killarneymall.co.za",
    phone: "+27 11 646 1024",
    region: "Gauteng, South Africa",
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
    region: "Gauteng, South Africa",
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
    region: "Gauteng, South Africa",
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
    region: "Limpopo, South Africa",
    accountStatus: "Active",
    contractType: "Retainer",
    taxId: "ZA4112233445",
    billingAddress: "78 Hans van Rensburg Street, Polokwane",
    activeProjects: 1,
    notes: "Lift service and compliance inspections.",
  }),
];

function buildGeneratedClients(count: number): ManagedClient[] {
  const rows: ManagedClient[] = [];
  for (let i = 0; i < count; i++) {
    const brand = SA_PROPERTY_NAMES[i % SA_PROPERTY_NAMES.length];
    const prefix = SA_PROPERTY_PREFIXES[i % SA_PROPERTY_PREFIXES.length];
    const city = SA_CITIES[i % SA_CITIES.length];
    const region = SA_REGIONS[i % SA_REGIONS.length];
    const industry = SA_INDUSTRIES[i % SA_INDUSTRIES.length];
    const first = SA_FIRST_NAMES[i % SA_FIRST_NAMES.length];
    const last = SA_LAST_NAMES[(i * 3) % SA_LAST_NAMES.length];
    const slug = brand.toLowerCase().replace(/\s+/g, "-");
    const companyName =
      i % 4 === 0 ? `${brand} ${prefix}` : `${city} ${prefix} ${i + 1}`;
    const status = ACCOUNT_STATUSES[i % ACCOUNT_STATUSES.length];
    const activeProjects =
      status === "Active" ? (i % 3 === 0 ? 2 : i % 5 === 0 ? 0 : 1) : 0;

    rows.push(
      client({
        id: `saec-cli-gen-${String(i + 1).padStart(4, "0")}`,
        companyName,
        industry,
        primaryContact: `${first} ${last}`,
        email: `facilities.${slug}${i + 1}@omnitransit-client.demo`,
        phone: `+27 ${10 + (i % 9)} ${String(200 + (i % 800)).padStart(3, "0")} ${String(1000 + i).slice(-4)}`,
        region,
        accountStatus: status,
        contractType: CONTRACT_TYPES[i % CONTRACT_TYPES.length],
        taxId: `ZA4${String(100000000 + i).slice(0, 9)}`,
        billingAddress: `${city}, ${region}`,
        activeProjects,
        notes: `${SAEC_COMPANY_NAME} service relationship — demonstration record.`,
      }),
    );
  }
  return rows;
}

let cachedPortfolio: ManagedClient[] | null = null;

/** Full OmniTransit demo client portfolio (250 accounts). */
export function getSaecDemoClientPortfolio(): ManagedClient[] {
  if (!cachedPortfolio) {
    const generated = buildGeneratedClients(SAEC_DEMO_CLIENT_COUNT - SAEC_ANCHOR_CLIENTS.length);
    cachedPortfolio = [...SAEC_ANCHOR_CLIENTS, ...generated];
  }
  return cachedPortfolio.map((row) => ({ ...row }));
}

export function getSaecDemoActiveClientCount(): number {
  return getSaecDemoClientPortfolio().filter((row) => row.accountStatus === "Active").length;
}
