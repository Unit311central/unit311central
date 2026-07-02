export type ClientIndustry =
  | "Construction"
  | "Mining & Resources"
  | "Logistics & Ports"
  | "Energy & Utilities"
  | "Government & Public"
  | "Property & Heritage"
  | "Infrastructure"
  | "Other";

export type ClientAccountStatus = "Active" | "Prospect" | "On Hold" | "Inactive";

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
  | "Europe-wide";

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
  activeProjects: number;
  notes: string;
  /** Linked folder in the internal file repository. */
  filesFolderId?: string | null;
  filesFolderName?: string | null;
  /** Optional link to a client-facing intelligence platform demo. */
  platformUrl?: string;
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
  "Active",
  "Prospect",
  "On Hold",
  "Inactive",
];

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
];

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
      accountStatus: "Prospect",
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
    accountStatus: "Prospect",
    contractType: "Project-based",
    taxId: "",
    billingAddress: "",
    activeProjects: 0,
    notes: "",
  };
}

export function clientStatusClass(status: ClientAccountStatus) {
  switch (status) {
    case "Active":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-300";
    case "Prospect":
      return "border-sky-400/40 bg-sky-500/15 text-sky-300";
    case "On Hold":
      return "border-amber-400/40 bg-amber-500/15 text-amber-200";
    case "Inactive":
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
  active_projects: number;
  notes: string;
  platform_url: string | null;
  files_folder_id: string | null;
  files_folder_name: string | null;
  created_at: string;
  updated_at: string;
};

export function mapInternalClient(row: DbInternalClient): ManagedClient {
  return {
    id: row.id,
    companyName: row.company_name,
    industry: row.industry as ClientIndustry,
    primaryContact: row.primary_contact,
    email: row.email,
    phone: row.phone,
    region: row.region as ClientRegion,
    accountStatus: row.account_status as ClientAccountStatus,
    contractType: row.contract_type as ClientContractType,
    taxId: row.tax_id,
    billingAddress: row.billing_address,
    activeProjects: row.active_projects,
    notes: row.notes,
    filesFolderId: row.files_folder_id ?? undefined,
    filesFolderName: row.files_folder_name ?? undefined,
    platformUrl: row.platform_url ?? undefined,
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
    a.activeProjects === b.activeProjects &&
    a.notes === b.notes &&
    (a.filesFolderId ?? "") === (b.filesFolderId ?? "") &&
    (a.filesFolderName ?? "") === (b.filesFolderName ?? "") &&
    (a.platformUrl ?? "") === (b.platformUrl ?? "")
  );
}
