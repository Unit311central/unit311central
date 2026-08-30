import {
  QA_BETA_REPORT_TYPES,
  type QaBetaReportTypeId,
} from "@/lib/qa-workspace/constants";
import type { QaPageContext, QaWorkspaceTaskInput } from "@/lib/qa-workspace/types";

const BETA_TYPE_PREFIX = "beta:";

export function isQaBetaReportTypeId(value: string | null | undefined): value is QaBetaReportTypeId {
  return QA_BETA_REPORT_TYPES.some((entry) => entry.id === value);
}

export function formatQaBetaReportTypeLabel(typeId: string | null | undefined): string | null {
  if (!typeId) return null;
  const normalized = typeId.startsWith(BETA_TYPE_PREFIX)
    ? typeId.slice(BETA_TYPE_PREFIX.length)
    : typeId;
  const match = QA_BETA_REPORT_TYPES.find((entry) => entry.id === normalized);
  return match?.label ?? null;
}

export function encodeQaBetaReportElementType(typeId: QaBetaReportTypeId): string {
  return `${BETA_TYPE_PREFIX}${typeId}`;
}

export function decodeQaBetaReportElementType(elementType: string | null | undefined): QaBetaReportTypeId | null {
  if (!elementType) return null;
  const normalized = elementType.startsWith(BETA_TYPE_PREFIX)
    ? elementType.slice(BETA_TYPE_PREFIX.length)
    : elementType;
  return isQaBetaReportTypeId(normalized) ? normalized : null;
}

export function buildBetaReportTaskInput(input: {
  pageContext: QaPageContext;
  reportTypeId: QaBetaReportTypeId;
  description: string;
}): QaWorkspaceTaskInput {
  const typeLabel =
    QA_BETA_REPORT_TYPES.find((entry) => entry.id === input.reportTypeId)?.label ??
    input.reportTypeId;

  return {
    scope: "page",
    moduleLabel: input.pageContext.moduleLabel,
    moduleId: input.pageContext.moduleId,
    pageLabel: input.pageContext.pageLabel,
    pageViewId: input.pageContext.pageViewId,
    routePath: input.pageContext.routePath,
    elementLabel: typeLabel,
    elementType: encodeQaBetaReportElementType(input.reportTypeId),
    elementId: input.pageContext.pageViewId,
    description: input.description.trim(),
    status: "open",
  };
}

export function isQaBetaReportTask(elementType: string | null | undefined): boolean {
  return Boolean(elementType?.startsWith(BETA_TYPE_PREFIX));
}
