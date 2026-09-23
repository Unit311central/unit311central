/**
 * QMS — agreed product taxonomy (Core Module → Core Features).
 *
 *   1 Core Module · 6 Core Features · 0 Core Sub-features · 0 Custom
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const QMS_MODULE_ID = "qms" as const;

export const QMS_MODULE_LABEL = "QMS" as const;

export type QmsCoreFeature = {
  label: string;
  viewId: InternalOperationsView;
};

export const QMS_CORE_FEATURES: readonly QmsCoreFeature[] = [
  { label: "Dashboard", viewId: "quality-management" },
  { label: "Document Control", viewId: "qms-document-control" },
  { label: "CAPA", viewId: "qms-capa" },
  { label: "Internal Audits", viewId: "qms-internal-audits" },
  { label: "Management Review", viewId: "qms-management-review" },
  { label: "Reporting", viewId: "qms-reports" },
] as const;

export const QMS_CUSTOM_FEATURES: readonly string[] = [];

export const QMS_CUSTOM_SUB_FEATURES: readonly string[] = [];

export function qmsCoreFeatureCount(): number {
  return QMS_CORE_FEATURES.length;
}

export function qmsCoreSubFeatureCount(): number {
  return 0;
}
