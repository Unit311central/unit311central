export type TelecomServiceStatus = "Active" | "Pending" | "Cancelled";

export type TechnologyTelecomService = {
  id: string;
  workspaceId: string;
  service: string;
  carrier: string;
  numberOrCircuit: string;
  assignedTo: string;
  location: string | null;
  monthlyCostMinor: number;
  currency: string;
  status: TelecomServiceStatus;
  manufacturer: string | null;
  model: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TechnologyTelecomServiceInput = {
  service: string;
  carrier: string;
  numberOrCircuit?: string;
  assignedTo?: string;
  location?: string | null;
  monthlyCostMinor?: number;
  status?: TelecomServiceStatus;
  manufacturer?: string | null;
  model?: string | null;
};

export function isMobileTelecomService(service: string): boolean {
  return /mobile/i.test(service);
}
