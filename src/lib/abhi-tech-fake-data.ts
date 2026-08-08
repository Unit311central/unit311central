/** ABHI-only fake Technology Management registers for Devices, Telecoms, and Tech Assets. */

export type AbhiTechDevice = {
  id: string;
  name: string;
  type: string;
  assignedTo: string;
  location: string;
  status: "In use" | "Spare" | "Repair";
  warranty: string;
};

export type AbhiTechTelecom = {
  id: string;
  service: string;
  carrier: string;
  numberOrCircuit: string;
  assignedTo: string;
  monthlyCostGbp: number;
  status: "Active" | "Pending" | "Cancelled";
  /** Mobile handsets only */
  manufacturer?: string;
  /** Mobile handsets only */
  model?: string;
};

export type AbhiTechRenewalItem = {
  id: string;
  label: string;
  category: "Software" | "Telecom" | "Device";
  dueDate: string;
  costGbp: number;
};

export const ABHI_TELECOMS_STORAGE_KEY = "unit311-abhi-telecoms-v1";

export function isAbhiMobileTelecomService(service: string): boolean {
  return /mobile/i.test(service);
}

export function loadAbhiTelecoms(): AbhiTechTelecom[] {
  if (typeof window === "undefined") return [...ABHI_TECH_TELECOMS];
  try {
    const raw = window.localStorage.getItem(ABHI_TELECOMS_STORAGE_KEY);
    if (!raw) return [...ABHI_TECH_TELECOMS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...ABHI_TECH_TELECOMS];
    return parsed.filter(
      (row): row is AbhiTechTelecom =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as AbhiTechTelecom).id === "string" &&
        typeof (row as AbhiTechTelecom).service === "string",
    );
  } catch {
    return [...ABHI_TECH_TELECOMS];
  }
}

export function saveAbhiTelecoms(rows: readonly AbhiTechTelecom[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ABHI_TELECOMS_STORAGE_KEY, JSON.stringify(rows));
}

export function sumAbhiTelecomMonthlySpend(rows: readonly AbhiTechTelecom[]): number {
  return rows.reduce((sum, row) => sum + row.monthlyCostGbp, 0);
}

/** Fake but stable MoM tech spend trend (software + telecom baseline). */
export function buildAbhiTechSpendTrend(input: {
  softwareMonthlyGbp: number;
  telecomMonthlyGbp: number;
}) {
  const latest = input.softwareMonthlyGbp + input.telecomMonthlyGbp;
  const momPct = -2.4;
  const prior = latest / (1 + momPct / 100);
  const momGbp = Math.round(latest - prior);
  const labels = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const scale = [0.97, 0.985, 0.992, 1.01, 1.018, 1];
  const values = scale.map((factor) => Math.round(latest * factor));
  values[values.length - 1] = Math.round(latest);
  return { momPct, momGbp, labels, values, latest: Math.round(latest) };
}

export const ABHI_UPCOMING_TECH_RENEWALS: AbhiTechRenewalItem[] = [
  {
    id: "abhi-ren-1",
    label: "Microsoft 365 Business Premium",
    category: "Software",
    dueDate: "2026-10-01",
    costGbp: 12_960,
  },
  {
    id: "abhi-ren-2",
    label: "Zoom Workplace",
    category: "Software",
    dueDate: "2027-02-01",
    costGbp: 2_700,
  },
  {
    id: "abhi-ren-3",
    label: "Office fibre — BT Business",
    category: "Telecom",
    dueDate: "2026-09-15",
    costGbp: 2_640,
  },
  {
    id: "abhi-ren-4",
    label: "DocuSign eSignature",
    category: "Software",
    dueDate: "2026-11-20",
    costGbp: 2_400,
  },
  {
    id: "abhi-ren-5",
    label: "MacBook Pro 14 — Jane Lewis",
    category: "Device",
    dueDate: "2027-03-01",
    costGbp: 1_899,
  },
];

export type AbhiTechAsset = {
  id: string;
  tag: string;
  name: string;
  category: string;
  owner: string;
  location: string;
  valueGbp: number;
};

export const ABHI_TECH_DEVICES: AbhiTechDevice[] = [
  {
    id: "abhi-dev-1",
    name: "MacBook Pro 14",
    type: "Laptop",
    assignedTo: "Jane Lewis",
    location: "London HQ",
    status: "In use",
    warranty: "Mar 2027",
  },
  {
    id: "abhi-dev-2",
    name: "Dell Latitude 5440",
    type: "Laptop",
    assignedTo: "Paul Benton",
    location: "London HQ",
    status: "In use",
    warranty: "Nov 2026",
  },
  {
    id: "abhi-dev-3",
    name: "iPhone 15",
    type: "Mobile",
    assignedTo: "Michelle Michelucci",
    location: "London HQ",
    status: "In use",
    warranty: "Sep 2026",
  },
  {
    id: "abhi-dev-4",
    name: "iPad Pro 11",
    type: "Tablet",
    assignedTo: "Events Desk",
    location: "Events Store",
    status: "Spare",
    warranty: "Jan 2027",
  },
  {
    id: "abhi-dev-5",
    name: "HP EliteDisplay E27",
    type: "Monitor",
    assignedTo: "Bayode Adisa",
    location: "London HQ",
    status: "In use",
    warranty: "Jun 2026",
  },
  {
    id: "abhi-dev-6",
    name: "ThinkPad X1 Carbon",
    type: "Laptop",
    assignedTo: "IT Spare Pool",
    location: "London HQ",
    status: "Repair",
    warranty: "Aug 2026",
  },
];

export const ABHI_TECH_TELECOMS: AbhiTechTelecom[] = [
  {
    id: "abhi-tel-1",
    service: "Mobile plan",
    carrier: "EE",
    numberOrCircuit: "+44 7700 900211",
    assignedTo: "Jane Lewis",
    monthlyCostGbp: 45,
    status: "Active",
    manufacturer: "Apple",
    model: "iPhone 15",
  },
  {
    id: "abhi-tel-2",
    service: "Mobile plan",
    carrier: "Vodafone",
    numberOrCircuit: "+44 7700 900318",
    assignedTo: "Paul Benton",
    monthlyCostGbp: 38,
    status: "Active",
    manufacturer: "Samsung",
    model: "Galaxy S24",
  },
  {
    id: "abhi-tel-3",
    service: "Office fibre",
    carrier: "BT Business",
    numberOrCircuit: "BT-LON-ABHI-8841",
    assignedTo: "London HQ",
    monthlyCostGbp: 220,
    status: "Active",
  },
  {
    id: "abhi-tel-4",
    service: "Events hotspot SIMs",
    carrier: "Three",
    numberOrCircuit: "Pool × 8",
    assignedTo: "Events Team",
    monthlyCostGbp: 96,
    status: "Active",
  },
  {
    id: "abhi-tel-5",
    service: "Conference bridge",
    carrier: "Microsoft Teams Phone",
    numberOrCircuit: "+44 20 3880 4410",
    assignedTo: "Membership Ops",
    monthlyCostGbp: 65,
    status: "Pending",
  },
];

export const ABHI_TECH_ASSETS: AbhiTechAsset[] = [
  {
    id: "abhi-ta-1",
    tag: "ABHI-LT-014",
    name: "MacBook Pro 14 — Jane Lewis",
    category: "Laptop",
    owner: "Jane Lewis",
    location: "London HQ",
    valueGbp: 1899,
  },
  {
    id: "abhi-ta-2",
    tag: "ABHI-PH-022",
    name: "iPhone 15 — Michelle Michelucci",
    category: "Mobile",
    owner: "Michelle Michelucci",
    location: "London HQ",
    valueGbp: 849,
  },
  {
    id: "abhi-ta-3",
    tag: "ABHI-AV-003",
    name: "Event AV kit (projector + mics)",
    category: "AV",
    owner: "Events Desk",
    location: "Events Store",
    valueGbp: 2400,
  },
  {
    id: "abhi-ta-4",
    tag: "ABHI-NET-001",
    name: "Office Ubiquiti switch stack",
    category: "Networking",
    owner: "Technology",
    location: "London HQ Comms",
    valueGbp: 1250,
  },
  {
    id: "abhi-ta-5",
    tag: "ABHI-TAB-008",
    name: "iPad Pro — Membership tours",
    category: "Tablet",
    owner: "Membership",
    location: "London HQ",
    valueGbp: 999,
  },
];

export type AbhiTechReport = {
  id: string;
  title: string;
  category: string;
  period: string;
  owner: string;
  status: "Ready" | "Draft" | "Scheduled";
  summary: string;
  generatedAt: string;
};

/** Five IT-ready reports for ABHI Technology Management — London HQ · GBP. */
export const ABHI_TECH_REPORTS: AbhiTechReport[] = [
  {
    id: "abhi-rpt-1",
    title: "Device utilisation — London HQ estate",
    category: "Devices",
    period: "Q2 2026",
    owner: "Technology Desk",
    status: "Ready",
    summary:
      "In-use vs spare vs repair across laptops, mobiles, and event AV kit. Spare pool healthy; one iPad in repair after WHX briefing tour.",
    generatedAt: "2026-07-28",
  },
  {
    id: "abhi-rpt-2",
    title: "M365 licence compliance & seat waste",
    category: "Software",
    period: "Jul 2026",
    owner: "Jane Lewis",
    status: "Ready",
    summary:
      "Seat allocation vs purchase for M365, Teams Phone, and Adobe Creative Cloud. Flags unused seats and upcoming renewals in GBP.",
    generatedAt: "2026-07-30",
  },
  {
    id: "abhi-rpt-3",
    title: "Telecom spend forecast (GBP)",
    category: "Telecom",
    period: "FY2026 H2",
    owner: "Jane Lewis",
    status: "Ready",
    summary:
      "Run-rate for fibre, mobile plans, conference bridge, and roaming for international events. Projects ~£4.2k/mo combined with software.",
    generatedAt: "2026-08-01",
  },
  {
    id: "abhi-rpt-4",
    title: "Technology renewal calendar",
    category: "Renewals",
    period: "Next 6 months",
    owner: "Technology Desk",
    status: "Scheduled",
    summary:
      "M365, Ubiquiti stack, CEO laptop warranty, and event AV kit refresh windows with estimated GBP costs.",
    generatedAt: "2026-08-02",
  },
  {
    id: "abhi-rpt-5",
    title: "Member CRM & backup health",
    category: "Infrastructure",
    period: "Aug 2026",
    owner: "Phil Brown",
    status: "Draft",
    summary:
      "Dynamics member data sync uptime, nightly backup RPO for membership CRM, and event registration API availability.",
    generatedAt: "2026-08-03",
  },
];
