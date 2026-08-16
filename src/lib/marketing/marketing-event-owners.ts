import { ABHI_EVENT_OWNERS } from "@/lib/abhi-marketing-store";
import type { MarketingWorkspaceKey } from "@/lib/marketing/workspace-context";

export const NORTHSTAR_EVENT_OWNERS = [
  { id: "nst-staff-marcus", name: "Marcus Reed" },
  { id: "nst-staff-elena", name: "Elena Hart" },
  { id: "nst-staff-priya", name: "Priya Shah" },
  { id: "nst-staff-james", name: "James Okonkwo" },
  { id: "nst-staff-sarah", name: "Sarah Pemberton" },
] as const;

export function getMarketingEventOwners(workspace: MarketingWorkspaceKey) {
  if (workspace === "demo") return NORTHSTAR_EVENT_OWNERS;
  return ABHI_EVENT_OWNERS;
}
