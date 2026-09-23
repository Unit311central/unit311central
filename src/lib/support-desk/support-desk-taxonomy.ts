/**
 * Support Desk — agreed product taxonomy (Core Module → Core Features).
 *
 *   1 Core Module · 4 Core Features · 0 Core Sub-features · 0 Custom
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const SUPPORT_DESK_MODULE_ID = "support-desk" as const;

export const SUPPORT_DESK_MODULE_LABEL = "Support Desk" as const;

export type SupportDeskCoreFeature = {
  label: string;
  viewId: InternalOperationsView;
};

export const SUPPORT_DESK_CORE_FEATURES: readonly SupportDeskCoreFeature[] = [
  { label: "Ticket Overview", viewId: "support-overview" },
  { label: "Tickets", viewId: "support" },
  { label: "My support tickets", viewId: "support-mine" },
  { label: "WhatsApp Integration", viewId: "whatsapp-integration" },
] as const;

export const SUPPORT_DESK_CUSTOM_FEATURES: readonly string[] = [];

export const SUPPORT_DESK_CUSTOM_SUB_FEATURES: readonly string[] = [];

export function supportDeskCoreFeatureCount(): number {
  return SUPPORT_DESK_CORE_FEATURES.length;
}

export function supportDeskCoreSubFeatureCount(): number {
  return 0;
}
