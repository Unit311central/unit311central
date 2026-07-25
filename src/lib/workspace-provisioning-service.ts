import { RESERVED_UNIT311_SUBDOMAINS } from "@/lib/app-domains";
import { slugifyOrganisationName } from "@/lib/organisation-slug";
import { findWorkspaceBySlug } from "@/lib/workspace-host";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

const WORKSPACE_PENDING_PAYMENT_STATUS = "Pending Payment";
const DEMO_WORKSPACE_SLUG = "demo";

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createSupabaseServerClient();
}

export async function uniqueCustomerWorkspaceSlug(companyName: string): Promise<string> {
  const base = slugifyOrganisationName(companyName) || "workspace";
  let candidate = base;
  let suffix = 2;

  while (true) {
    if (RESERVED_UNIT311_SUBDOMAINS.has(candidate)) {
      candidate = `${base}-${suffix}`.slice(0, 64);
      suffix += 1;
      continue;
    }

    const existing = await findWorkspaceBySlug(candidate);
    if (!existing) return candidate;

    candidate = `${base}-${suffix}`.slice(0, 64);
    suffix += 1;
  }
}

/**
 * Calls provision_workspace() then sets status to Pending Payment
 * (provisioned but not login-ready / not activated).
 */
export async function provisionCustomerWorkspace(input: {
  companyName: string;
  workspaceSlug?: string;
}): Promise<{ workspaceId: string; workspaceSlug: string }> {
  const supabase = requireSupabase();
  const workspaceSlug =
    input.workspaceSlug?.trim().toLowerCase() ||
    (await uniqueCustomerWorkspaceSlug(input.companyName));

  const { data, error } = await supabase.rpc("provision_workspace", {
    company_name: input.companyName.trim(),
    workspace_slug: workspaceSlug,
  });

  if (error) {
    throw new Error(error.message || "Failed to provision workspace.");
  }

  const workspaceId = typeof data === "string" ? data : String(data);
  if (!workspaceId) {
    throw new Error("provision_workspace did not return a workspace id.");
  }

  const { error: statusError } = await supabase
    .from("workspaces")
    .update({
      status: WORKSPACE_PENDING_PAYMENT_STATUS,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workspaceId);

  if (statusError) {
    throw new Error(statusError.message);
  }

  return { workspaceId, workspaceSlug };
}

/**
 * Idempotent Demo workspace ensure (config only — no business data).
 * Uses ensure_demo_workspace() when available; falls back to provision_workspace('demo').
 */
export async function ensureDemoWorkspace(): Promise<{
  workspaceId: string;
  workspaceSlug: string;
}> {
  const supabase = requireSupabase();

  const { data, error } = await supabase.rpc("ensure_demo_workspace");
  if (!error && data) {
    return {
      workspaceId: typeof data === "string" ? data : String(data),
      workspaceSlug: DEMO_WORKSPACE_SLUG,
    };
  }

  // Fallback for hosts that have not applied migration 119 yet.
  const { data: provisioned, error: provisionError } = await supabase.rpc("provision_workspace", {
    company_name: "Unit311 Central Demo",
    workspace_slug: DEMO_WORKSPACE_SLUG,
  });

  if (provisionError) {
    const existing = await findWorkspaceBySlug(DEMO_WORKSPACE_SLUG);
    if (existing) {
      return { workspaceId: existing.id, workspaceSlug: existing.slug };
    }
    throw new Error(
      error?.message ||
        provisionError.message ||
        "Failed to ensure Demo workspace.",
    );
  }

  return {
    workspaceId: typeof provisioned === "string" ? provisioned : String(provisioned),
    workspaceSlug: DEMO_WORKSPACE_SLUG,
  };
}

export async function ensureWorkspaceOwnerMembership(input: {
  workspaceId: string;
  platformUserId: string;
}) {
  const supabase = requireSupabase();

  const { data: existing, error: existingError } = await supabase
    .from("workspace_users")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", input.platformUserId)
    .maybeSingle();

  if (existingError && !existingError.message.includes("does not exist")) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    await supabase
      .from("workspace_users")
      .update({
        role: "owner",
        is_owner: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return;
  }

  const { error } = await supabase.from("workspace_users").insert({
    workspace_id: input.workspaceId,
    user_id: input.platformUserId,
    role: "owner",
    is_owner: true,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export { WORKSPACE_PENDING_PAYMENT_STATUS, DEMO_WORKSPACE_SLUG };
