import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { workspacePrimaryUrlForWorkspace } from "@/lib/platform-workspaces/workspace-hostname";
import type { WorkspaceImportClient } from "@/lib/platform-workspaces/types";

export type ClientProvisioningRequest = {
  workspaceId: string;
  workspaceSlug: string;
  customerHostname: string;
  clients: WorkspaceImportClient[];
};

export type ClientProvisioningResult = {
  status: "complete" | "skipped" | "failed";
  provisionedCount: number;
  message: string;
};

function slugifyClientId(name: string, index: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `client-${base || "import"}-${index + 1}`;
}

export async function provisionWorkspaceClients(
  request: ClientProvisioningRequest,
): Promise<ClientProvisioningResult> {
  if (request.clients.length === 0) {
    return {
      status: "skipped",
      provisionedCount: 0,
      message: "No clients were provided for provisioning.",
    };
  }

  const supabase = createTenancyServerClient();
  const platformUrl = workspacePrimaryUrlForWorkspace(
    request.workspaceSlug,
    request.customerHostname,
  );
  let provisionedCount = 0;

  for (let index = 0; index < request.clients.length; index += 1) {
    const client = request.clients[index]!;
    const companyName = client.name.trim();
    if (!companyName) continue;

    const clientId = slugifyClientId(companyName, index);
    const email = client.email?.trim().toLowerCase() ?? "";
    const region = client.country?.trim() || "Unspecified";

    const { data: existing } = await supabase
      .from("internal_clients")
      .select("id")
      .eq("id", clientId)
      .eq("workspace_id", request.workspaceId)
      .maybeSingle();

    const row = {
      id: clientId,
      workspace_id: request.workspaceId,
      company_name: companyName,
      industry: "Other",
      primary_contact: companyName,
      email,
      phone: "",
      region,
      account_status: "Active",
      contract_type: "Project-based",
      tax_id: "",
      billing_address: region,
      active_projects: 0,
      notes: "Provisioned via Workspaces wizard.",
      platform_url: platformUrl,
      company_country: client.country?.trim() || "",
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error } = await supabase
        .from("internal_clients")
        .update({
          company_name: row.company_name,
          email: row.email,
          region: row.region,
          company_country: row.company_country,
          platform_url: row.platform_url,
          updated_at: row.updated_at,
        })
        .eq("id", clientId)
        .eq("workspace_id", request.workspaceId);
      if (error) {
        throw new Error(`Failed to update client ${companyName}: ${error.message}`);
      }
    } else {
      const { error } = await supabase.from("internal_clients").insert(row);
      if (error) {
        throw new Error(`Failed to create client ${companyName}: ${error.message}`);
      }
    }
    provisionedCount += 1;
  }

  return {
    status: "complete",
    provisionedCount,
    message:
      provisionedCount === 1
        ? "1 client record provisioned."
        : `${provisionedCount} client records provisioned.`,
  };
}
