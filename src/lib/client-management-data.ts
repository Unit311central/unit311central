import { resolveSupportLoungeOrigin } from "@/lib/app-domains";

export type ClientIndustry =
  | "Construction"
  | "Mining & Resources"
  | "Logistics & Ports"
  | "Energy & Utilities"
  | "Government & Public"
  | "Property & Heritage"
  | "Infrastructure"
  | "Other";

/** PRM-001 / FDR-MOD-011-LIFECYCLE — Directory-owned statuses only. */
export type ClientAccountStatus =
  | "Client Created"
  | "Workspace Provisioned"
  | "Onboarding"
  | "Active"
  | "Dormant"
  | "Archived";

/** Legacy values still may exist until migration 094; never writable. */
export type LegacyClientAccountStatus =
  | "Prospect"
  | "Pending"
  | "Pending Payment"
  | "On Hold"
  | "Inactive";

export type ClientContractType =
  | "Framework Agreement"
  | "Project-based"
  | "Retainer"
  | "Trial";

export type ClientRegion =
  | "Catalonia, Spain"
  | "Porto, Portugal"
  | "Oxfordshire, UK"
  | "Western Australia"
  | "Iberia"
  | "United Kingdom"
  | "Europe-wide"
  | "Sydney, NSW"
  | "Melbourne, VIC"
  | "Brisbane, QLD"
  | "Perth, WA"
  | "Adelaide, SA"
  | "Canberra, ACT"
  | "Hobart, TAS"
  | "Darwin, NT"
  | "Newcastle, NSW"
  | "Gold Coast, QLD"
  | "Sunshine Coast, QLD"
  | "Wollongong, NSW"
  | "Geelong, VIC"
  | "Cairns, QLD"
  | "Broken Hill, NSW"
  | "Gauteng, South Africa"
  | "Western Cape, South Africa"
  | "Limpopo, South Africa";

export type ClientSubscriptionStatus =
  | "inactive"
  | "pending_payment"
  | "active"
  | "suspended"
  | "cancelled";

export type ManagedClient = {
  id: string;
  companyName: string;
  industry: ClientIndustry;
  primaryContact: string;
  email: string;
  phone: string;
  region: ClientRegion;
  accountStatus: ClientAccountStatus;
  contractType: ClientContractType;
  taxId: string;
  billingAddress: string;
  jobTitle?: string;
  companyAddress?: string;
  companyCity?: string;
  companyPostcode?: string;
  companyCountry?: string;
  /** Accounts Payable email (stored as invoice_email). */
  accountsPayableEmail?: string;
  /** @deprecated Prefer accountsPayableEmail */
  invoiceEmail?: string;
  billingSameAsCompany?: boolean;
  primaryContactFirstName?: string;
  primaryContactSurname?: string;
  activeProjects: number;
  notes: string;
  /** Linked folder in the internal file repository. */
  filesFolderId?: string | null;
  filesFolderName?: string | null;
  /** Optional link to a client-facing intelligence platform demo. */
  platformUrl?: string;
  platformOrganisationId?: string | null;
  /** Support Lounge public token (path segment under /s/{token}). */
  supportLoungeToken?: string | null;
  /** Absolute Support Lounge entry URL for this client. */
  supportLoungeUrl?: string | null;
  supportLoungeEnabled?: boolean | null;
  subscriptionStatus?: ClientSubscriptionStatus | null;
  billingFrequency?: string | null;
  renewalDate?: string | null;
  paymentMethod?: string | null;
  crmLeadId?: string | null;
  provisioningStatus?: "none" | "provisioning_pending" | "provisioning" | "live" | null;
  onboardingStage?: string | null;
  activationDate?: string | null;
  paymentMatchedAt?: string | null;
  lastPaidInvoiceNumber?: string | null;
  lastWiseTransactionId?: string | null;
  /** ISO timestamps from internal_clients (live). */
  createdAt?: string | null;
  updatedAt?: string | null;
};

export const CLIENT_INDUSTRY_OPTIONS: ClientIndustry[] = [
  "Construction",
  "Mining & Resources",
  "Logistics & Ports",
  "Energy & Utilities",
  "Government & Public",
  "Property & Heritage",
  "Infrastructure",
  "Other",
];

export const CLIENT_STATUS_OPTIONS: ClientAccountStatus[] = [
  "Client Created",
  "Workspace Provisioned",
  "Onboarding",
  "Active",
  "Dormant",
  "Archived",
];

const CLIENT_STATUS_SET = new Set<string>(CLIENT_STATUS_OPTIONS);

/** Allowed Directory transitions (FDR-MOD-011-LIFECYCLE). Archived may restore to Dormant. */
const CLIENT_STATUS_TRANSITIONS: Readonly<
  Record<ClientAccountStatus, readonly ClientAccountStatus[]>
> = {
  "Client Created": ["Workspace Provisioned", "Onboarding", "Active", "Dormant", "Archived"],
  "Workspace Provisioned": ["Onboarding", "Active", "Archived"],
  Onboarding: ["Active", "Dormant", "Archived"],
  Active: ["Dormant", "Archived"],
  Dormant: ["Active", "Archived"],
  /** Restore path for Action Framework / Directory ops — returns to Dormant for review. */
  Archived: ["Dormant"],
};

export function isClientAccountStatus(value: unknown): value is ClientAccountStatus {
  return typeof value === "string" && CLIENT_STATUS_SET.has(value);
}

/** Read-path normalization — maps legacy → canonical. */
export function normalizeClientAccountStatus(value: unknown): ClientAccountStatus {
  if (isClientAccountStatus(value)) return value;
  switch (String(value ?? "").trim()) {
    case "Prospect":
      return "Client Created";
    case "Pending":
      return "Onboarding";
    case "Pending Payment":
      return "Workspace Provisioned";
    case "On Hold":
      return "Dormant";
    case "Inactive":
      return "Archived";
    case "Active":
      return "Active";
    default:
      return "Client Created";
  }
}

export function canTransitionClientAccountStatus(
  from: ClientAccountStatus,
  to: ClientAccountStatus,
): boolean {
  if (from === to) return true;
  return CLIENT_STATUS_TRANSITIONS[from].includes(to);
}

export function assertClientAccountStatusTransition(
  from: ClientAccountStatus,
  to: ClientAccountStatus,
): void {
  if (!canTransitionClientAccountStatus(from, to)) {
    throw new Error(
      `Invalid client lifecycle transition: ${from} → ${to}.`,
    );
  }
}

/** Dashboard “pre-active” bucket. */
export function isClientPreActiveStatus(status: ClientAccountStatus): boolean {
  return (
    status === "Client Created" ||
    status === "Workspace Provisioned" ||
    status === "Onboarding"
  );
}

export const CLIENT_CONTRACT_OPTIONS: ClientContractType[] = [
  "Framework Agreement",
  "Project-based",
  "Retainer",
  "Trial",
];

export const CLIENT_REGION_OPTIONS: ClientRegion[] = [
  "Catalonia, Spain",
  "Porto, Portugal",
  "Oxfordshire, UK",
  "Western Australia",
  "Iberia",
  "United Kingdom",
  "Europe-wide",
  "Sydney, NSW",
  "Melbourne, VIC",
  "Brisbane, QLD",
  "Perth, WA",
  "Adelaide, SA",
  "Canberra, ACT",
  "Hobart, TAS",
  "Darwin, NT",
  "Newcastle, NSW",
  "Gold Coast, QLD",
  "Sunshine Coast, QLD",
  "Wollongong, NSW",
  "Geelong, VIC",
  "Cairns, QLD",
  "Broken Hill, NSW",
  "Gauteng, South Africa",
  "Western Cape, South Africa",
  "Limpopo, South Africa",
];

/** Country + city resolved from legacy `region` values (e.g. Brisbane, QLD → Australia / Brisbane). */
export type ClientLocation = { country: string; city: string };

const REGION_TO_LOCATION: Record<string, ClientLocation> = {
  "Catalonia, Spain": { country: "Spain", city: "Catalonia" },
  "Porto, Portugal": { country: "Portugal", city: "Porto" },
  "Oxfordshire, UK": { country: "United Kingdom", city: "Oxfordshire" },
  "Western Australia": { country: "Australia", city: "Perth" },
  Iberia: { country: "Spain", city: "" },
  "United Kingdom": { country: "United Kingdom", city: "" },
  "Europe-wide": { country: "Europe", city: "" },
  "Sydney, NSW": { country: "Australia", city: "Sydney" },
  "Melbourne, VIC": { country: "Australia", city: "Melbourne" },
  "Brisbane, QLD": { country: "Australia", city: "Brisbane" },
  "Perth, WA": { country: "Australia", city: "Perth" },
  "Adelaide, SA": { country: "Australia", city: "Adelaide" },
  "Canberra, ACT": { country: "Australia", city: "Canberra" },
  "Hobart, TAS": { country: "Australia", city: "Hobart" },
  "Darwin, NT": { country: "Australia", city: "Darwin" },
  "Newcastle, NSW": { country: "Australia", city: "Newcastle" },
  "Gold Coast, QLD": { country: "Australia", city: "Gold Coast" },
  "Sunshine Coast, QLD": { country: "Australia", city: "Sunshine Coast" },
  "Wollongong, NSW": { country: "Australia", city: "Wollongong" },
  "Geelong, VIC": { country: "Australia", city: "Geelong" },
  "Cairns, QLD": { country: "Australia", city: "Cairns" },
  "Broken Hill, NSW": { country: "Australia", city: "Broken Hill" },
  "Gauteng, South Africa": { country: "South Africa", city: "Gauteng" },
  "Western Cape, South Africa": { country: "South Africa", city: "Western Cape" },
  "Limpopo, South Africa": { country: "South Africa", city: "Limpopo" },
};

const LOCATION_TO_REGION = new Map<string, ClientRegion>(
  Object.entries(REGION_TO_LOCATION).map(([region, loc]) => [
    `${loc.country.toLowerCase()}::${loc.city.toLowerCase()}`,
    region as ClientRegion,
  ]),
);

export const CLIENT_COUNTRY_OPTIONS = [
  "Australia",
  "United Kingdom",
  "Spain",
  "Portugal",
  "Europe",
] as const;

export function parseRegionToLocation(region: string | null | undefined): ClientLocation {
  const trimmed = String(region ?? "").trim();
  if (!trimmed) return { country: "", city: "" };
  const mapped = REGION_TO_LOCATION[trimmed];
  if (mapped) return { ...mapped };

  // Already "Country, City" (new display form)
  const countryCity = trimmed.match(/^([^,]+),\s*(.+)$/);
  if (countryCity) {
    const left = countryCity[1].trim();
    const right = countryCity[2].trim();
    if (CLIENT_COUNTRY_OPTIONS.some((c) => c.toLowerCase() === left.toLowerCase())) {
      return { country: left, city: right };
    }
    // Legacy "City, State/Country" fallback — treat left as city when right looks like a country/state code
    if (/^(UK|NSW|VIC|QLD|WA|SA|ACT|TAS|NT|Spain|Portugal)$/i.test(right)) {
      const fromState = REGION_TO_LOCATION[trimmed];
      if (fromState) return { ...fromState };
      if (/^UK$/i.test(right)) return { country: "United Kingdom", city: left };
      if (/^(NSW|VIC|QLD|WA|SA|ACT|TAS|NT)$/i.test(right)) {
        return { country: "Australia", city: left };
      }
      return { country: right, city: left };
    }
  }

  return { country: trimmed, city: "" };
}

export function resolveClientLocation(
  client: Pick<ManagedClient, "region" | "companyCountry" | "companyCity">,
): ClientLocation {
  const country = client.companyCountry?.trim() ?? "";
  const city = client.companyCity?.trim() ?? "";
  if (country || city) return { country, city };
  return parseRegionToLocation(client.region);
}

/** Display as "Country, City" (e.g. Australia, Brisbane). */
export function formatClientLocation(
  client: Pick<ManagedClient, "region" | "companyCountry" | "companyCity"> | ClientLocation,
): string {
  const loc =
    "country" in client && !("region" in client)
      ? (client as ClientLocation)
      : resolveClientLocation(client as Pick<ManagedClient, "region" | "companyCountry" | "companyCity">);
  if (loc.country && loc.city) return `${loc.country}, ${loc.city}`;
  return loc.country || loc.city || "";
}

export function composeLegacyRegion(country: string, city: string): ClientRegion {
  const c = country.trim();
  const cityName = city.trim();
  const key = `${c.toLowerCase()}::${cityName.toLowerCase()}`;
  const mapped = LOCATION_TO_REGION.get(key);
  if (mapped) return mapped;
  if (c && !cityName) {
    const countryOnly = LOCATION_TO_REGION.get(`${c.toLowerCase()}::`);
    if (countryOnly) return countryOnly;
    if (c === "United Kingdom") return "United Kingdom";
    if (c === "Europe") return "Europe-wide";
  }
  if (c && cityName) return `${cityName}, ${c}` as ClientRegion;
  return (c || "United Kingdom") as ClientRegion;
}

export function clientCitiesForCountry(country: string): string[] {
  const c = country.trim().toLowerCase();
  if (!c) return [];
  const cities = new Set<string>();
  for (const loc of Object.values(REGION_TO_LOCATION)) {
    if (loc.country.toLowerCase() === c && loc.city) cities.add(loc.city);
  }
  return Array.from(cities).sort((a, b) => a.localeCompare(b));
}

let clientCounter = 6;

export function createClientId() {
  clientCounter += 1;
  return `client-${clientCounter}`;
}

export function createInitialClients(): ManagedClient[] {
  return [
    {
      id: "client-venturi",
      companyName: "Venturi Aeronautical",
      industry: "Other",
      primaryContact: "Eduard Gómez",
      email: "e.gomez@venturi.aero",
      phone: "+34 93 200 4500",
      region: "Catalonia, Spain",
      companyCountry: "Spain",
      companyCity: "Catalonia",
      accountStatus: "Active",
      contractType: "Framework Agreement",
      taxId: "ES-B65432109",
      billingAddress: "Parc Tecnològic Barcelona, 08034 Barcelona, Spain",
      activeProjects: 5,
      notes:
        "Electric VTOL platform manufacturer — feasibility, R&D, regulatory compliance, certification support, and operational test site services.",
      platformUrl: "/client/venturi",
    },
    {
      id: "client-1",
      companyName: "Catalonia Energy Partners",
      industry: "Energy & Utilities",
      primaryContact: "Elena Morales",
      email: "e.morales@cataloniaenergy.es",
      phone: "+34 93 412 8800",
      region: "Catalonia, Spain",
      companyCountry: "Spain",
      companyCity: "Catalonia",
      accountStatus: "Active",
      contractType: "Framework Agreement",
      taxId: "ES-B66233441",
      billingAddress: "Av. Diagonal 211, 08018 Barcelona, Spain",
      activeProjects: 3,
      notes: "Solar corridor and substation inspection programme.",
    },
    {
      id: "client-2",
      companyName: "Douro Maritime Logistics",
      industry: "Logistics & Ports",
      primaryContact: "Rui Ferreira",
      email: "rui.ferreira@dourologistics.pt",
      phone: "+351 22 340 1200",
      region: "Porto, Portugal",
      companyCountry: "Portugal",
      companyCity: "Porto",
      accountStatus: "Active",
      contractType: "Project-based",
      taxId: "PT509876543",
      billingAddress: "Terminal Intermodal, 4450-208 Matosinhos, Portugal",
      activeProjects: 2,
      notes: "Quarterly berth and stockpile volumetrics.",
    },
    {
      id: "client-3",
      companyName: "Oxford Heritage Survey Ltd",
      industry: "Property & Heritage",
      primaryContact: "James Whitfield",
      email: "j.whitfield@oxfordheritage.co.uk",
      phone: "+44 1865 742 900",
      region: "Oxfordshire, UK",
      companyCountry: "United Kingdom",
      companyCity: "Oxfordshire",
      accountStatus: "Active",
      contractType: "Retainer",
      taxId: "GB123456789",
      billingAddress: "24 Beaumont Street, Oxford OX1 2NP, UK",
      activeProjects: 4,
      notes: "Listed building envelope and campus mapping.",
    },
    {
      id: "client-4",
      companyName: "Iberia Infrastructure Group",
      industry: "Infrastructure",
      primaryContact: "Sofia Alvarez",
      email: "sofia.alvarez@iberiainfra.com",
      phone: "+34 91 555 0142",
      region: "Iberia",
      companyCountry: "Spain",
      companyCity: "",
      accountStatus: "Client Created",
      contractType: "Trial",
      taxId: "ES-A80192736",
      billingAddress: "Paseo de la Castellana 95, 28046 Madrid, Spain",
      activeProjects: 0,
      notes: "Pilot corridor mapping — awaiting Q3 mobilisation.",
    },
    {
      id: "client-westport",
      companyName: "Westport Logistics Hub",
      industry: "Logistics & Ports",
      primaryContact: "Marcus Chen",
      email: "m.chen@terrabuild.com.au",
      phone: "+61 8 9432 8800",
      region: "Western Australia",
      companyCountry: "Australia",
      companyCity: "Perth",
      accountStatus: "Active",
      contractType: "Framework Agreement",
      taxId: "AU 51 824 753 556",
      billingAddress: "TerraBuild Infrastructure, Perth WA 6000, Australia",
      activeProjects: 1,
      notes:
        "TerraBuild Infrastructure — 240ha industrial logistics precinct. Earthworks, warehouse zones, and drainage monitoring. Project value $180M · target completion March 2026.",
      platformUrl: "/test1",
    },
  ];
}

export function createBlankClient(): ManagedClient {
  return {
    id: createClientId(),
    companyName: "",
    industry: "Construction",
    primaryContact: "",
    email: "",
    phone: "",
    region: "United Kingdom",
    accountStatus: "Client Created",
    contractType: "Project-based",
    taxId: "",
    billingAddress: "",
    companyAddress: "",
    companyCity: "",
    companyPostcode: "",
    companyCountry: "United Kingdom",
    accountsPayableEmail: "",
    invoiceEmail: "",
    billingSameAsCompany: true,
    primaryContactFirstName: "",
    primaryContactSurname: "",
    jobTitle: "",
    activeProjects: 0,
    notes: "",
    subscriptionStatus: null,
    billingFrequency: null,
    renewalDate: null,
    paymentMethod: null,
    crmLeadId: null,
    provisioningStatus: "none",
    onboardingStage: null,
    activationDate: null,
    paymentMatchedAt: null,
    lastPaidInvoiceNumber: null,
    lastWiseTransactionId: null,
  };
}

export function clientStatusClass(status: ClientAccountStatus) {
  switch (status) {
    case "Active":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-300";
    case "Client Created":
      return "border-sky-400/40 bg-sky-500/15 text-sky-300";
    case "Workspace Provisioned":
    case "Onboarding":
      return "border-amber-400/40 bg-amber-500/15 text-amber-200";
    case "Dormant":
      return "border-violet-400/40 bg-violet-500/15 text-violet-200";
    case "Archived":
      return "border-white/20 bg-white/10 text-white/60";
    default:
      return "border-white/20 bg-white/10 text-white/60";
  }
}

type DbInternalClient = {
  id: string;
  company_name: string;
  industry: string;
  primary_contact: string;
  email: string;
  phone: string;
  region: string;
  account_status: string;
  contract_type: string;
  tax_id: string;
  billing_address: string;
  job_title: string | null;
  company_address: string | null;
  company_city?: string | null;
  company_postcode?: string | null;
  company_country?: string | null;
  invoice_email: string | null;
  billing_same_as_company?: boolean | null;
  primary_contact_first_name?: string | null;
  primary_contact_surname?: string | null;
  active_projects: number;
  notes: string;
  platform_url: string | null;
  platform_organisation_id: string | null;
  files_folder_id: string | null;
  files_folder_name: string | null;
  subscription_status?: string | null;
  billing_frequency?: string | null;
  renewal_date?: string | null;
  payment_method?: string | null;
  crm_lead_id?: string | null;
  provisioning_status?: string | null;
  onboarding_stage?: string | null;
  activation_date?: string | null;
  payment_matched_at?: string | null;
  last_paid_invoice_number?: string | null;
  last_wise_transaction_id?: string | null;
  support_lounge_token?: string | null;
  support_lounge_enabled?: boolean | null;
  created_at: string;
  updated_at: string;
};

export function mapInternalClient(
  row: DbInternalClient,
  options?: { workspaceSlug?: string | null; loungeOrigin?: string | null },
): ManagedClient {
  const loungeToken = row.support_lounge_token?.trim() || null;
  const fromRegion = parseRegionToLocation(row.region);
  const companyCountry = (row.company_country ?? "").trim() || fromRegion.country || undefined;
  const companyCity = (row.company_city ?? "").trim() || fromRegion.city || undefined;
  const loungeOrigin = (
    options?.loungeOrigin?.trim() ||
    resolveSupportLoungeOrigin(options?.workspaceSlug)
  ).replace(/\/$/, "");
  return {
    id: row.id,
    companyName: row.company_name,
    industry: row.industry as ClientIndustry,
    primaryContact: row.primary_contact,
    email: row.email,
    phone: row.phone,
    region: row.region as ClientRegion,
    accountStatus: normalizeClientAccountStatus(row.account_status),
    contractType: row.contract_type as ClientContractType,
    taxId: row.tax_id,
    billingAddress: row.billing_address,
    jobTitle: row.job_title ?? undefined,
    companyAddress: row.company_address ?? undefined,
    companyCity,
    companyPostcode: row.company_postcode ?? undefined,
    companyCountry,
    accountsPayableEmail: row.invoice_email ?? undefined,
    invoiceEmail: row.invoice_email ?? undefined,
    billingSameAsCompany: row.billing_same_as_company ?? undefined,
    primaryContactFirstName: row.primary_contact_first_name ?? undefined,
    primaryContactSurname: row.primary_contact_surname ?? undefined,
    activeProjects: row.active_projects,
    notes: row.notes,
    filesFolderId: row.files_folder_id != null ? String(row.files_folder_id) : undefined,
    filesFolderName: row.files_folder_name ?? undefined,
    platformUrl: row.platform_url ?? undefined,
    platformOrganisationId: row.platform_organisation_id ?? undefined,
    supportLoungeToken: loungeToken,
    supportLoungeUrl: loungeToken
      ? `${loungeOrigin}/s/${encodeURIComponent(loungeToken)}`
      : null,
    supportLoungeEnabled: row.support_lounge_enabled ?? null,
    subscriptionStatus: (row.subscription_status as ClientSubscriptionStatus | null) ?? null,
    billingFrequency: row.billing_frequency ?? null,
    renewalDate: row.renewal_date ?? null,
    paymentMethod: row.payment_method ?? null,
    crmLeadId: row.crm_lead_id ?? null,
    provisioningStatus:
      (row.provisioning_status as ManagedClient["provisioningStatus"]) ?? null,
    onboardingStage: row.onboarding_stage ?? null,
    activationDate: row.activation_date ?? null,
    paymentMatchedAt: row.payment_matched_at ?? null,
    lastPaidInvoiceNumber: row.last_paid_invoice_number ?? null,
    lastWiseTransactionId: row.last_wise_transaction_id ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function clientFieldsEqual(a: ManagedClient, b: ManagedClient) {
  return (
    a.companyName === b.companyName &&
    a.industry === b.industry &&
    a.primaryContact === b.primaryContact &&
    a.email === b.email &&
    a.phone === b.phone &&
    a.region === b.region &&
    a.accountStatus === b.accountStatus &&
    a.contractType === b.contractType &&
    a.taxId === b.taxId &&
    a.billingAddress === b.billingAddress &&
    (a.companyAddress ?? "") === (b.companyAddress ?? "") &&
    (a.companyCity ?? "") === (b.companyCity ?? "") &&
    (a.companyPostcode ?? "") === (b.companyPostcode ?? "") &&
    (a.companyCountry ?? "") === (b.companyCountry ?? "") &&
    (a.accountsPayableEmail ?? a.invoiceEmail ?? "") ===
      (b.accountsPayableEmail ?? b.invoiceEmail ?? "") &&
    a.activeProjects === b.activeProjects &&
    a.notes === b.notes &&
    (a.filesFolderId ?? "") === (b.filesFolderId ?? "") &&
    (a.filesFolderName ?? "") === (b.filesFolderName ?? "") &&
    (a.platformUrl ?? "") === (b.platformUrl ?? "")
  );
}
