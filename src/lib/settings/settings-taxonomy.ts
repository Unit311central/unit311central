/**
 * Settings — agreed product taxonomy (Core Module → Core Features).
 *
 *   1 Core Module · 4 Core Features · 0 Core Sub-features · 0 Custom
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const SETTINGS_MODULE_ID = "settings" as const;

export const SETTINGS_MODULE_LABEL = "Settings" as const;

export type SettingsCoreFeature = {
  label: string;
  viewId: InternalOperationsView;
};

export const SETTINGS_CORE_FEATURES: readonly SettingsCoreFeature[] = [
  { label: "Profile", viewId: "profile" },
  { label: "General", viewId: "settings" },
  { label: "Billing", viewId: "billing" },
  { label: "Appearance", viewId: "appearance" },
] as const;

export const SETTINGS_CUSTOM_FEATURES: readonly string[] = [];

export const SETTINGS_CUSTOM_SUB_FEATURES: readonly string[] = [];

export function settingsCoreFeatureCount(): number {
  return SETTINGS_CORE_FEATURES.length;
}

export function settingsCoreSubFeatureCount(): number {
  return 0;
}
