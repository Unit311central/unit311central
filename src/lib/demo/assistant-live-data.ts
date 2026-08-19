/**
 * Demo workspace live-data resolvers for EA tools (mirrors listHrEmployeesForAssistant).
 */

import type { LedgerInvoice } from "@/lib/accounting/types";
import type { ManagedClient } from "@/lib/client-management-data";
import type { CrmLead, LeadStatus } from "@/lib/crm-data";
import type { InternalProject } from "@/lib/projects-data";

import type { LiveInvoiceLoad } from "@/lib/ai-operating-assistant/live-finance";
import { isLiveInvoiceOverdue } from "@/lib/ai-operating-assistant/live-finance";

export type AssistantWorkspaceScope = {
  workspaceId?: string | null;
  workspaceSlug?: string | null;
};

async function isDemoWorkspace(scope?: AssistantWorkspaceScope): Promise<boolean> {
  const { isDemoWorkspaceSlug } = await import("@/lib/demo/read-only");
  return isDemoWorkspaceSlug(scope?.workspaceSlug);
}

export async function listLeadsForAssistant(
  status?: LeadStatus | "All",
  scope?: AssistantWorkspaceScope,
): Promise<CrmLead[]> {
  if (await isDemoWorkspace(scope)) {
    const { getNorthstarCrmLeads } = await import("@/lib/demo/module-fixtures");
    const leads = getNorthstarCrmLeads();
    if (!status || status === "All") return leads;
    return leads.filter((lead) => lead.status === status);
  }

  const { listLeads } = await import("@/lib/crm-leads-service");
  return listLeads(status, { workspaceId: scope?.workspaceId });
}

export async function listClientsForAssistant(
  scope?: AssistantWorkspaceScope,
): Promise<ManagedClient[]> {
  if (await isDemoWorkspace(scope)) {
    const { getNorthstarClients } = await import("@/lib/demo/module-fixtures");
    return getNorthstarClients() as ManagedClient[];
  }

  const { listInternalClients } = await import("@/lib/internal-clients-service");
  return listInternalClients({
    workspaceId: scope?.workspaceId,
    workspaceSlug: scope?.workspaceSlug,
  });
}

export async function listProjectsForAssistant(
  scope?: AssistantWorkspaceScope,
): Promise<InternalProject[]> {
  if (await isDemoWorkspace(scope)) {
    const { getNorthstarProjects } = await import("@/lib/demo/module-fixtures");
    return getNorthstarProjects();
  }

  const { listProjects } = await import("@/lib/internal-projects-service");
  return listProjects({ workspaceId: scope?.workspaceId });
}

export async function loadInvoicesForAssistant(
  scope?: AssistantWorkspaceScope,
): Promise<LiveInvoiceLoad> {
  if (await isDemoWorkspace(scope)) {
    const { getNorthstarInvoices } = await import("@/lib/demo/northstar-ap-ar-fixtures");
    const invoices = getNorthstarInvoices();
    const overdue = invoices.filter((invoice) => isLiveInvoiceOverdue(invoice));
    return { ok: true, invoices, overdue };
  }

  const { loadLiveInvoices } = await import("@/lib/ai-operating-assistant/live-finance");
  return loadLiveInvoices();
}
