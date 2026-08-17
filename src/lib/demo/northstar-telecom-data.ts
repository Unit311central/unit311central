/** Northstar demo Technology Management — office fibre and mobile fleet. */

export type NorthstarTechTelecom = {
  id: string;
  service: string;
  carrier: string;
  numberOrCircuit: string;
  assignedTo: string;
  office: string;
  monthlyCostGbp: number;
  status: "Active" | "Pending" | "Cancelled";
  manufacturer?: string;
  model?: string;
};

export const NORTHSTAR_TELECOMS_STORAGE_KEY = "unit311-northstar-telecoms-v1";

export function isNorthstarMobileTelecomService(service: string): boolean {
  return /mobile/i.test(service);
}

export const NORTHSTAR_TECH_TELECOMS: NorthstarTechTelecom[] = [
  {
    id: "nst-tel-fibre-1",
    service: "Office fibre",
    carrier: "BT Business",
    numberOrCircuit: "BT-MAN-NST-8842 · 1 Gbps symmetrical",
    assignedTo: "Manchester HQ",
    office: "Manchester",
    monthlyCostGbp: 520,
    status: "Active",
  },
  {
    id: "nst-tel-fibre-2",
    service: "Office fibre",
    carrier: "Virgin Media Business",
    numberOrCircuit: "VM-BRI-NST-3291 · 500 Mbps",
    assignedTo: "Bristol office",
    office: "Bristol",
    monthlyCostGbp: 315,
    status: "Active",
  },
  {
    id: "nst-tel-fibre-3",
    service: "Office fibre",
    carrier: "AT&T Business",
    numberOrCircuit: "ATT-AUS-NST-6610 · 1 Gbps",
    assignedTo: "Austin office",
    office: "Austin",
    monthlyCostGbp: 445,
    status: "Active",
  },
  {
    id: "nst-tel-mob-1",
    service: "Mobile plan",
    carrier: "EE",
    numberOrCircuit: "+44 7700 901101",
    assignedTo: "Daniel Cooper",
    office: "Manchester",
    monthlyCostGbp: 78,
    status: "Active",
    manufacturer: "Apple",
    model: "iPhone 15 Pro",
  },
  {
    id: "nst-tel-mob-2",
    service: "Mobile plan",
    carrier: "Vodafone",
    numberOrCircuit: "+44 7700 901102",
    assignedTo: "Marcus Morgan",
    office: "Manchester",
    monthlyCostGbp: 72,
    status: "Active",
    manufacturer: "Apple",
    model: "iPhone 15",
  },
  {
    id: "nst-tel-mob-3",
    service: "Mobile plan",
    carrier: "EE",
    numberOrCircuit: "+44 7700 901103",
    assignedTo: "Hannah Reed",
    office: "Manchester",
    monthlyCostGbp: 68,
    status: "Active",
    manufacturer: "Apple",
    model: "iPhone 14",
  },
  {
    id: "nst-tel-mob-4",
    service: "Mobile plan",
    carrier: "O2",
    numberOrCircuit: "+44 7700 901104",
    assignedTo: "Harry Shah",
    office: "Manchester",
    monthlyCostGbp: 76,
    status: "Active",
    manufacturer: "Apple",
    model: "iPhone 15 Pro",
  },
  {
    id: "nst-tel-mob-5",
    service: "Mobile plan",
    carrier: "EE",
    numberOrCircuit: "+44 7700 901105",
    assignedTo: "Emily Hughes",
    office: "Manchester",
    monthlyCostGbp: 65,
    status: "Active",
    manufacturer: "Apple",
    model: "iPhone 15",
  },
  {
    id: "nst-tel-mob-6",
    service: "Mobile plan",
    carrier: "Vodafone",
    numberOrCircuit: "+44 7700 901106",
    assignedTo: "Oliver Foster",
    office: "Manchester",
    monthlyCostGbp: 54,
    status: "Active",
    manufacturer: "Samsung",
    model: "Galaxy S24",
  },
  {
    id: "nst-tel-mob-7",
    service: "Mobile plan",
    carrier: "O2",
    numberOrCircuit: "+44 7700 901107",
    assignedTo: "Noah Morgan",
    office: "Manchester",
    monthlyCostGbp: 58,
    status: "Active",
    manufacturer: "Apple",
    model: "iPhone 15",
  },
  {
    id: "nst-tel-mob-8",
    service: "Mobile plan",
    carrier: "Three",
    numberOrCircuit: "+44 7700 901108",
    assignedTo: "Rachel Nguyen",
    office: "Manchester",
    monthlyCostGbp: 42,
    status: "Active",
    manufacturer: "Apple",
    model: "iPhone 14",
  },
  {
    id: "nst-tel-mob-9",
    service: "Mobile plan",
    carrier: "EE",
    numberOrCircuit: "+44 7700 901109",
    assignedTo: "Mia Bennett",
    office: "Bristol",
    monthlyCostGbp: 62,
    status: "Active",
    manufacturer: "Apple",
    model: "iPhone 15",
  },
  {
    id: "nst-tel-mob-10",
    service: "Mobile plan",
    carrier: "Three",
    numberOrCircuit: "+44 7700 901110",
    assignedTo: "Sophie Powell",
    office: "Bristol",
    monthlyCostGbp: 46,
    status: "Active",
    manufacturer: "Google",
    model: "Pixel 8",
  },
  {
    id: "nst-tel-mob-11",
    service: "Mobile plan",
    carrier: "Vodafone",
    numberOrCircuit: "+44 7700 901111",
    assignedTo: "Ethan Whitfield",
    office: "Bristol",
    monthlyCostGbp: 38,
    status: "Active",
    manufacturer: "Samsung",
    model: "Galaxy A54",
  },
  {
    id: "nst-tel-mob-12",
    service: "Mobile plan",
    carrier: "EE",
    numberOrCircuit: "+44 7700 901112",
    assignedTo: "Aisha Clarke",
    office: "Bristol",
    monthlyCostGbp: 36,
    status: "Active",
    manufacturer: "Apple",
    model: "iPhone 13",
  },
  {
    id: "nst-tel-mob-13",
    service: "Mobile plan",
    carrier: "AT&T",
    numberOrCircuit: "+1 512 555 0142",
    assignedTo: "Oliver Price",
    office: "Austin",
    monthlyCostGbp: 66,
    status: "Active",
    manufacturer: "Apple",
    model: "iPhone 14",
  },
  {
    id: "nst-tel-mob-14",
    service: "Mobile plan",
    carrier: "AT&T",
    numberOrCircuit: "+1 512 555 0143",
    assignedTo: "Elena Hughes",
    office: "Austin",
    monthlyCostGbp: 58,
    status: "Active",
    manufacturer: "Apple",
    model: "iPhone 14",
  },
  {
    id: "nst-tel-mob-15",
    service: "Mobile plan",
    carrier: "AT&T",
    numberOrCircuit: "+1 512 555 0144",
    assignedTo: "Aisha Bailey",
    office: "Austin",
    monthlyCostGbp: 52,
    status: "Active",
    manufacturer: "Samsung",
    model: "Galaxy S23",
  },
];

export function sumNorthstarTelecomMonthlySpend(rows: readonly NorthstarTechTelecom[]): number {
  return rows.reduce((sum, row) => sum + row.monthlyCostGbp, 0);
}

export const NORTHSTAR_TELECOM_MONTHLY_TOTAL = sumNorthstarTelecomMonthlySpend(NORTHSTAR_TECH_TELECOMS);

export function loadNorthstarTelecoms(): NorthstarTechTelecom[] {
  if (typeof window === "undefined") return [...NORTHSTAR_TECH_TELECOMS];
  try {
    const raw = window.localStorage.getItem(NORTHSTAR_TELECOMS_STORAGE_KEY);
    if (!raw) return [...NORTHSTAR_TECH_TELECOMS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...NORTHSTAR_TECH_TELECOMS];
    return parsed.filter(
      (row): row is NorthstarTechTelecom =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as NorthstarTechTelecom).id === "string" &&
        typeof (row as NorthstarTechTelecom).service === "string",
    );
  } catch {
    return [...NORTHSTAR_TECH_TELECOMS];
  }
}

export function saveNorthstarTelecoms(rows: readonly NorthstarTechTelecom[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NORTHSTAR_TELECOMS_STORAGE_KEY, JSON.stringify(rows));
}
