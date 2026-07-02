export type LeadStatus = "Cold" | "Warm" | "Hot" | "Won" | "Lost";

export type CrmLead = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: string;
  nextAction: string;
  nextActionDate: string | null;
  estimatedValue: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export const LEAD_STATUS_OPTIONS: LeadStatus[] = ["Cold", "Warm", "Hot", "Won", "Lost"];

export const LEAD_SOURCE_OPTIONS = [
  "Website",
  "Referral",
  "LinkedIn",
  "Trade show",
  "Cold outreach",
  "Existing client",
  "Other",
] as const;

type DbLead = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  next_action: string | null;
  next_action_date: string | null;
  estimated_value: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function mapCrmLead(row: DbLead): CrmLead {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    status: row.status as LeadStatus,
    source: row.source ?? "",
    nextAction: row.next_action ?? "",
    nextActionDate: row.next_action_date,
    estimatedValue: row.estimated_value,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function leadStatusClass(status: LeadStatus) {
  switch (status) {
    case "Cold":
      return "border-sky-400/40 bg-sky-500/15 text-sky-300";
    case "Warm":
      return "border-amber-400/40 bg-amber-500/15 text-amber-200";
    case "Hot":
      return "border-red-400/40 bg-red-500/15 text-red-300";
    case "Won":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-300";
    case "Lost":
      return "border-white/20 bg-white/10 text-white/55";
  }
}

export function formatLeadDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function createBlankLeadInput() {
  return {
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    status: "Cold" as LeadStatus,
    source: "Website",
    nextAction: "",
    nextActionDate: null as string | null,
    estimatedValue: null as number | null,
    notes: "",
  };
}
