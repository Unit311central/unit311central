import type { ManagedClient } from "@/lib/client-management-data";
import { isClientPreActiveStatus } from "@/lib/client-management-data";
import type { OaBcDashboardSummary } from "@/lib/onwardair/business-central-data";

/** Non-archived Client Directory rows — same definition as Clients Dashboard KPIs. */
export function clientDirectoryRows(clients: readonly ManagedClient[]): ManagedClient[] {
  return clients.filter((client) => client.accountStatus !== "Archived");
}

export function buildWorkspaceBcDashboardSummaryFromClients(
  clients: readonly ManagedClient[],
): OaBcDashboardSummary {
  const directory = clientDirectoryRows(clients);
  const activeClients = directory.filter((client) => client.accountStatus === "Active").length;
  const onboardingClients = directory.filter((client) =>
    isClientPreActiveStatus(client.accountStatus),
  ).length;

  return {
    clientsCount: directory.length,
    activeClients,
    arrUsd: 0,
    pipelineValueUsd: 0,
    pipelineByStage: [],
    discoveryCount: 0,
    onboardingCount: onboardingClients,
    partnersCount: 0,
    partnerRegions: [],
    commissionPipelineUsd: 0,
  };
}
