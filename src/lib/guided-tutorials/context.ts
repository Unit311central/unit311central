import { FINANCES_MODULE_LABEL } from "@/lib/finances-nav";
import {
  getInternalNavBreadcrumb,
  resolveInternalViewTitles,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import { SALES_MANAGEMENT_MODULE_LABEL } from "@/lib/sales-management-nav";
import {
  DEFAULT_SALES_MANAGEMENT_TAB,
  getSalesManagementNavGroupForTab,
  getSalesManagementTabLabel,
  isSalesManagementTab,
  type SalesManagementTabId,
} from "@/lib/sales-management-tabs";
import { FINANCES_QUERY_PARAM_VIEWS } from "@/lib/finances-nav";
import { SALES_MANAGEMENT_QUERY_PARAM_VIEWS } from "@/lib/sales-management-nav";

/** Resolved screen identity for the Learn engine — derived from nav catalogues, not ad hoc strings. */
export type TutorialContext = {
  workspaceSlug: string;
  viewId: string;
  tabKey?: string;
  moduleLabel: string;
  sectionLabel: string;
  functionLabel: string;
  /** Stable key for caching generated lessons later (workspace:view:tab). */
  contextKey: string;
  breadcrumb: readonly string[];
};

function normalizeTabKey(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Read the active tab/section query param for the current view from URL search params. */
export function resolveTutorialTabKey(
  viewId: string,
  searchParams: Pick<URLSearchParams, "get">,
): string | undefined {
  if (SALES_MANAGEMENT_QUERY_PARAM_VIEWS.has(viewId as InternalOperationsView)) {
    const tab = searchParams.get("tab");
    return isSalesManagementTab(tab) ? tab : DEFAULT_SALES_MANAGEMENT_TAB;
  }

  if (FINANCES_QUERY_PARAM_VIEWS.has(viewId as InternalOperationsView)) {
    return (
      normalizeTabKey(searchParams.get("tab")) ??
      normalizeTabKey(searchParams.get("filter")) ??
      normalizeTabKey(searchParams.get("section"))
    );
  }

  return normalizeTabKey(searchParams.get("tab"));
}

function resolveSalesManagementContext(tabKey: string): Pick<
  TutorialContext,
  "moduleLabel" | "sectionLabel" | "functionLabel"
> {
  const tab = isSalesManagementTab(tabKey) ? tabKey : DEFAULT_SALES_MANAGEMENT_TAB;
  return {
    moduleLabel: SALES_MANAGEMENT_MODULE_LABEL,
    sectionLabel: getSalesManagementNavGroupForTab(tab),
    functionLabel: getSalesManagementTabLabel(tab),
  };
}

function resolveFinancesDashboardContext(): Pick<
  TutorialContext,
  "moduleLabel" | "sectionLabel" | "functionLabel"
> {
  const titles = resolveInternalViewTitles("financials");
  return {
    moduleLabel: FINANCES_MODULE_LABEL,
    sectionLabel: FINANCES_MODULE_LABEL,
    functionLabel: titles.title,
  };
}

/** Build Module → Section → Function labels from existing navigation metadata. */
export function buildTutorialContext(input: {
  workspaceSlug: string;
  viewId: string;
  tabKey?: string;
}): TutorialContext {
  const workspaceSlug = input.workspaceSlug.trim().toLowerCase();
  const viewId = input.viewId.trim();
  const tabKey = normalizeTabKey(input.tabKey);
  const breadcrumb = getInternalNavBreadcrumb(viewId as InternalOperationsView);

  let labels: Pick<TutorialContext, "moduleLabel" | "sectionLabel" | "functionLabel">;

  if (viewId === "sales-management" && tabKey) {
    labels = resolveSalesManagementContext(tabKey);
  } else if (viewId === "financials" && !tabKey) {
    labels = resolveFinancesDashboardContext();
  } else {
    const titles = resolveInternalViewTitles(viewId as InternalOperationsView);
    const moduleLabel = breadcrumb[0] ?? titles.subtitle ?? viewId;
    const functionLabel = titles.title ?? viewId;
    const sectionLabel =
      breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 1]! : titles.subtitle ?? moduleLabel;
    labels = { moduleLabel, sectionLabel, functionLabel };
  }

  const contextKey = [workspaceSlug, viewId, tabKey ?? ""].join(":");

  return {
    workspaceSlug,
    viewId,
    tabKey,
    breadcrumb,
    contextKey,
    ...labels,
  };
}

export function formatTutorialContextPath(context: TutorialContext): string {
  const parts: string[] = [context.moduleLabel];
  if (context.sectionLabel && context.sectionLabel !== context.moduleLabel) {
    parts.push(context.sectionLabel);
  }
  if (context.functionLabel && !parts.includes(context.functionLabel)) {
    parts.push(context.functionLabel);
  }
  return parts.join(" → ");
}

export type { SalesManagementTabId };
