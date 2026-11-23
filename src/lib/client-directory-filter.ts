import type { ManagedClient } from "@/lib/client-management-data";
import {
  clientTypeBadgeLabel,
  formatClientLocation,
  isClientType,
  resolveClientLocation,
  type ClientAccountStatus,
  type ClientType,
} from "@/lib/client-management-data";
import { clientDirectoryRows } from "@/lib/business-central/workspace-dashboard-summary";

export type ClientDirectoryListFilters = {
  search: string;
  industry: string;
  country: string;
  city: string;
  status: ClientAccountStatus | "all";
  contract: string;
  clientType: ClientType | "all";
};

/** Rows shown in BC Client Directory — non-archived by default; Archived only when explicitly filtered. */
export function filterClientDirectoryDisplayRows(
  clients: readonly ManagedClient[],
  filters: ClientDirectoryListFilters,
): ManagedClient[] {
  const query = filters.search.trim().toLowerCase();

  let pool: ManagedClient[];
  if (filters.status === "Archived") {
    pool = clients.filter((client) => client.accountStatus === "Archived");
  } else {
    pool = clientDirectoryRows(clients);
    if (filters.status !== "all") {
      pool = pool.filter((client) => client.accountStatus === filters.status);
    }
  }

  return pool.filter((client) => {
    const location = resolveClientLocation(client);
    if (filters.industry !== "all" && client.industry !== filters.industry) return false;
    if (filters.country !== "all" && location.country !== filters.country) return false;
    if (filters.city !== "all" && location.city !== filters.city) return false;
    if (filters.contract !== "all" && client.contractType !== filters.contract) return false;
    if (filters.clientType !== "all" && client.clientType !== filters.clientType) return false;
    if (!query) return true;

    const haystack = [
      client.companyName,
      client.primaryContact,
      client.email,
      location.country,
      location.city,
      formatClientLocation(location),
      client.industry,
      client.contractType,
      client.accountStatus,
      client.billingAddress,
      client.clientType ?? "",
      isClientType(client.clientType) ? clientTypeBadgeLabel(client.clientType) : "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}
