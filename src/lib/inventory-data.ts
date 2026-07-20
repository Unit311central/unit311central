/** Inventory Management — operational asset control (distinct from Asset Register master data). */

export const INVENTORY_STATUSES = [
  "operational",
  "maintenance",
  "out_of_service",
  "retired",
] as const;
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

export const INVENTORY_STATUS_LABELS: Record<InventoryStatus, string> = {
  operational: "Operational",
  maintenance: "Maintenance",
  out_of_service: "Out of Service",
  retired: "Retired",
};

export const INVENTORY_CONDITIONS = ["excellent", "good", "fair", "poor"] as const;
export type InventoryCondition = (typeof INVENTORY_CONDITIONS)[number];

export const INVENTORY_CONDITION_LABELS: Record<InventoryCondition, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

export const INVENTORY_CATEGORIES = [
  "Aircraft",
  "Payload",
  "Ground Station",
  "Battery",
  "IT Equipment",
  "Vehicle",
  "Tools",
  "Other",
] as const;

export const INVENTORY_PANEL_TABS = [
  "Overview",
  "Assignment",
  "Maintenance",
  "Documents",
  "History",
  "Notes",
] as const;
export type InventoryPanelTab = (typeof INVENTORY_PANEL_TABS)[number];

export type InventoryAssignment = {
  employee: string;
  department: string;
  office: string;
  project: string;
  issueDate: string;
  expectedReturn: string;
};

export type InventoryServiceRecord = {
  id: string;
  type: "service" | "inspection" | "calibration" | "repair" | "certification";
  date: string;
  nextDue: string;
  provider: string;
  outcome: string;
  notes: string;
  status: "scheduled" | "completed" | "overdue";
};

export type InventoryDocument = {
  id: string;
  kind: "manual" | "warranty" | "invoice" | "certificate" | "inspection" | "photo" | "other";
  name: string;
  uploadedAt: string;
};

export type InventoryHistoryEvent = {
  id: string;
  at: string;
  label: string;
  detail: string;
};

export type InventoryNote = {
  id: string;
  at: string;
  author: string;
  kind: "operational" | "damage" | "issue";
  text: string;
};

export type InventoryAsset = {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseCost: string;
  warrantyExpiry: string;
  currentValue: string;
  location: string;
  status: InventoryStatus;
  condition: InventoryCondition;
  department: string;
  assignedTo: string;
  nextService: string;
  certificationExpiry: string;
  assignment: InventoryAssignment;
  services: InventoryServiceRecord[];
  documents: InventoryDocument[];
  history: InventoryHistoryEvent[];
  notes: InventoryNote[];
  archived: boolean;
};

export type InventoryActivityItem = {
  id: string;
  at: string;
  label: string;
  detail: string;
};

export function inventoryStatusClass(status: InventoryStatus) {
  switch (status) {
    case "operational":
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
    case "maintenance":
      return "border-amber-400/30 bg-amber-500/15 text-amber-200";
    case "out_of_service":
      return "border-rose-400/30 bg-rose-500/15 text-rose-200";
    case "retired":
      return "border-white/15 bg-white/5 text-white/55";
  }
}

export function emptyAssignment(): InventoryAssignment {
  return {
    employee: "",
    department: "",
    office: "",
    project: "",
    issueDate: "",
    expectedReturn: "",
  };
}

export function daysUntil(dateKey: string) {
  if (!dateKey) return Number.POSITIVE_INFINITY;
  const target = new Date(`${dateKey}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isWithinDays(dateKey: string | null | undefined, days: number) {
  if (!dateKey) return false;
  const diff = daysUntil(dateKey);
  return diff >= 0 && diff <= days;
}
