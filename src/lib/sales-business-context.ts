/**
 * Sales Management business context.
 * Separate from Business Central Management's managementContext selector.
 * Isolation applies only inside the unit311 workspace. Every other workspace
 * keeps workspace-only reads and writes the default context.
 */

export const SALES_BUSINESS_CONTEXTS = ["unit311central", "wolf"] as const;

export type SalesBusinessContext = (typeof SALES_BUSINESS_CONTEXTS)[number];

export const DEFAULT_SALES_BUSINESS_CONTEXT: SalesBusinessContext = "unit311central";

export const UNIT311_SALES_WORKSPACE_SLUG = "unit311";

export const SALES_BUSINESS_CONTEXT_FIELD = "businessContext";

export class SalesBusinessContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SalesBusinessContextError";
  }
}

export function isSalesBusinessContext(value: unknown): value is SalesBusinessContext {
  return value === "unit311central" || value === "wolf";
}

function presentContextValue(value: unknown): unknown {
  if (value == null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

/**
 * Read the sales context from the query string and, when present, a JSON body.
 * The two sources must agree. An empty value means "not supplied".
 */
export function readRequestedSalesBusinessContext(request: Request, body?: unknown): unknown {
  const fromQuery = presentContextValue(
    new URL(request.url).searchParams.get(SALES_BUSINESS_CONTEXT_FIELD),
  );
  const fromBody =
    body && typeof body === "object"
      ? presentContextValue((body as Record<string, unknown>)[SALES_BUSINESS_CONTEXT_FIELD])
      : undefined;

  if (fromQuery !== undefined && fromBody !== undefined && String(fromQuery).trim() !== String(fromBody).trim()) {
    throw new SalesBusinessContextError("Conflicting sales business context.");
  }
  return fromQuery ?? fromBody;
}

/**
 * Resolve the context that Sales Management will enforce.
 * Returns null when the workspace is not unit311: callers must not add a
 * business_context filter, and writes use the default context.
 */
export function resolveSalesBusinessContext(input: {
  workspaceSlug: string | null | undefined;
  requested?: unknown;
}): SalesBusinessContext | null {
  const requested = presentContextValue(input.requested);
  if (requested !== undefined) {
    const normalized = typeof requested === "string" ? requested.trim() : requested;
    if (!isSalesBusinessContext(normalized)) {
      throw new SalesBusinessContextError("Invalid sales business context.");
    }
  }

  const slug = input.workspaceSlug?.trim().toLowerCase();
  if (slug !== UNIT311_SALES_WORKSPACE_SLUG) return null;
  if (requested === undefined) return DEFAULT_SALES_BUSINESS_CONTEXT;
  return (typeof requested === "string" ? requested.trim() : requested) as SalesBusinessContext;
}

export function salesBusinessContextColumn(
  businessContext: SalesBusinessContext | null | undefined,
): SalesBusinessContext {
  return businessContext ?? DEFAULT_SALES_BUSINESS_CONTEXT;
}

export function salesRecordScope(
  workspace: { id: string; slug: string },
  requested?: unknown,
): {
  workspaceId: string;
  workspaceSlug: string;
  businessContext?: SalesBusinessContext;
} {
  const businessContext = resolveSalesBusinessContext({
    workspaceSlug: workspace.slug,
    requested,
  });
  return {
    workspaceId: workspace.id,
    workspaceSlug: workspace.slug,
    ...(businessContext ? { businessContext } : {}),
  };
}

export function clientsVisibleInSalesContext<T extends { clientType?: string | null }>(
  clients: T[],
  businessContext: SalesBusinessContext | null | undefined,
): T[] {
  if (!businessContext) return clients;
  return clients.filter((client) => client.clientType === businessContext);
}

/**
 * Filter a client list only when the caller asked for a sales context.
 * A request without `businessContext` keeps the full workspace list, so the
 * Client Directory is unchanged. Inside the unit311 workspace the requested
 * context keeps clients of that type. Other workspaces stay unfiltered.
 */
export function filterClientsForRequestedSalesContext<T extends { clientType?: string | null }>(
  clients: T[],
  workspaceSlug: string | null | undefined,
  requested: unknown,
): T[] {
  if (presentContextValue(requested) === undefined) return clients;
  return clientsVisibleInSalesContext(
    clients,
    resolveSalesBusinessContext({ workspaceSlug, requested }),
  );
}

export function applySalesBusinessContext<T>(
  query: T,
  businessContext: SalesBusinessContext | null | undefined,
): T {
  if (!businessContext) return query;
  return (query as { eq: (column: string, value: string) => T }).eq(
    "business_context",
    businessContext,
  );
}

export function salesBusinessContextStatus(error: unknown): number | null {
  return error instanceof SalesBusinessContextError ? 400 : null;
}
