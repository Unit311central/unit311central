import type { ClientType } from "@/lib/client-management-data";
import { isClientType } from "@/lib/client-management-data";
import { SALES_BUSINESS_CONTEXT_FIELD } from "@/lib/sales-business-context";

export type ClientDirectoryBusinessContext = ClientType | "all";

export const CLIENT_DIRECTORY_CONTEXT_OPTIONS: ReadonlyArray<{
  id: ClientDirectoryBusinessContext;
  label: string;
}> = [
  { id: "all", label: "All Clients" },
  { id: "unit311central", label: "Unit311Central" },
  { id: "wolf", label: "WOLF" },
] as const;

export function isClientDirectoryBusinessContext(
  value: unknown,
): value is ClientDirectoryBusinessContext {
  return value === "all" || isClientType(value);
}

export function clientsListApiPath(context: ClientDirectoryBusinessContext): string {
  if (context === "all") return "/api/clients";
  return `/api/clients?${SALES_BUSINESS_CONTEXT_FIELD}=${context}`;
}

export function clientsPlatformCacheKey(context: ClientDirectoryBusinessContext): string {
  const base = "platform:clients";
  return context === "all" ? base : `${base}:${context}`;
}