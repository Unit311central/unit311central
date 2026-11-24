/**
 * Sales Management context switch.
 * The Postgres database and the workspace stay unit311. This choice only
 * selects the business_context stored on sales rows in that workspace.
 */

import {
  DEFAULT_SALES_BUSINESS_CONTEXT,
  SALES_BUSINESS_CONTEXT_FIELD,
  UNIT311_SALES_WORKSPACE_SLUG,
  isSalesBusinessContext,
  type SalesBusinessContext,
} from "@/lib/sales-business-context";

export const SALES_CONTEXT_QUERY_KEY = "salesContext";

export const SALES_CONTEXT_STORAGE_KEY = "unit311.sales-business-context";

export const SALES_CONTEXT_CHANGE_EVENT = "unit311-sales-business-context";

export const SALES_CONTEXT_OPTIONS: ReadonlyArray<{
  id: SalesBusinessContext;
  label: string;
}> = [
  { id: "unit311central", label: "UNIT311CENTRAL" },
  { id: "wolf", label: "WOLF" },
];

const INTERNAL_SALES_BASE_PATHS = new Set([
  "/",
  "/internaldashboard",
  "/internaldashboard_grants",
]);

const SALES_CONTEXT_API_ROOTS = [
  "/api/clients",
  "/api/crm/leads",
  "/api/crm/meetings",
  "/api/financials/sales-quotes",
  "/api/financials/quotes",
  "/api/sales-management/",
] as const;

let memoryContext: SalesBusinessContext = DEFAULT_SALES_BUSINESS_CONTEXT;

export function salesContextSelectorEnabled(input: {
  basePath: string | null | undefined;
  workspaceSlug?: string | null;
}): boolean {
  if (!INTERNAL_SALES_BASE_PATHS.has(input.basePath ?? "")) return false;
  return input.workspaceSlug?.trim().toLowerCase() === UNIT311_SALES_WORKSPACE_SLUG;
}

export function readSalesBusinessContext(): SalesBusinessContext {
  if (typeof window === "undefined") return memoryContext;
  try {
    const value = window.localStorage.getItem(SALES_CONTEXT_STORAGE_KEY);
    if (isSalesBusinessContext(value)) {
      memoryContext = value;
      return value;
    }
  } catch {
    return memoryContext;
  }
  return memoryContext;
}

export function writeSalesBusinessContext(context: SalesBusinessContext) {
  if (readSalesBusinessContext() === context) return;
  memoryContext = context;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SALES_CONTEXT_STORAGE_KEY, context);
  } catch {
    // The in-memory choice still drives the open Sales Management section.
  }
  window.dispatchEvent(new Event(SALES_CONTEXT_CHANGE_EVENT));
}

export function subscribeSalesBusinessContext(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const notify = () => onStoreChange();
  window.addEventListener(SALES_CONTEXT_CHANGE_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(SALES_CONTEXT_CHANGE_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}

export function salesBusinessContextServerSnapshot(): SalesBusinessContext {
  return DEFAULT_SALES_BUSINESS_CONTEXT;
}

export function salesBusinessContextClientSnapshot(): SalesBusinessContext {
  return readSalesBusinessContext();
}

/**
 * Keep `salesContext` on Sales Management URLs only.
 * The stored choice follows every tab in the section. Other views drop the param.
 */
export function applySalesContextSearchParam(
  params: URLSearchParams,
  activeView: string,
  navQuery: Record<string, string> | null,
  stored: SalesBusinessContext,
): void {
  if (activeView !== "sales-management") {
    params.delete(SALES_CONTEXT_QUERY_KEY);
    return;
  }
  const fromNav =
    navQuery && Object.prototype.hasOwnProperty.call(navQuery, SALES_CONTEXT_QUERY_KEY)
      ? navQuery[SALES_CONTEXT_QUERY_KEY]
      : undefined;
  const current = params.get(SALES_CONTEXT_QUERY_KEY);
  const chosen =
    fromNav === "wolf" || fromNav === "unit311central"
      ? fromNav
      : current === "wolf" || current === "unit311central"
        ? current
        : stored;
  if (chosen === "wolf") params.set(SALES_CONTEXT_QUERY_KEY, "wolf");
  else params.delete(SALES_CONTEXT_QUERY_KEY);
}

export function isSalesContextApiPath(pathname: string): boolean {
  return SALES_CONTEXT_API_ROOTS.some((root) =>
    root.endsWith("/") ? pathname.startsWith(root) : pathname === root || pathname.startsWith(`${root}/`),
  );
}

function requestUrl(input: RequestInfo | URL): URL | null {
  try {
    if (typeof input === "string") return new URL(input, "http://sales.local");
    if (input instanceof URL) return new URL(input.toString());
    if (typeof Request !== "undefined" && input instanceof Request) return new URL(input.url);
  } catch {
    return null;
  }
  return null;
}

function jsonBodyWithContext(
  pathname: string,
  init: RequestInit | undefined,
  context: SalesBusinessContext,
): RequestInit | undefined {
  if (!init?.body || typeof init.body !== "string") return init;
  if (pathname === "/api/clients" || pathname.startsWith("/api/clients/")) return init;
  const contentType = new Headers(init.headers).get("content-type") ?? "";
  if (!contentType.includes("application/json")) return init;
  try {
    const parsed = JSON.parse(init.body) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return init;
    return {
      ...init,
      body: JSON.stringify({ ...(parsed as Record<string, unknown>), [SALES_BUSINESS_CONTEXT_FIELD]: context }),
    };
  } catch {
    return init;
  }
}

/**
 * Add the sales context to a Sales Management API call.
 * The request stays on the same path. Nothing here selects another database.
 */
export function scopeSalesFetch(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  context: SalesBusinessContext | null | undefined,
): { input: RequestInfo | URL; init?: RequestInit } {
  if (!context) return { input, init };
  const url = requestUrl(input);
  if (!url || !isSalesContextApiPath(url.pathname)) return { input, init };
  url.searchParams.set(SALES_BUSINESS_CONTEXT_FIELD, context);
  const nextInit = jsonBodyWithContext(url.pathname, init, context);
  const relative = typeof input === "string" && input.startsWith("/");
  const nextInput = relative ? `${url.pathname}${url.search}` : url.toString();
  return { input: nextInput, init: nextInit };
}
