/**
 * Update SAEC workspace module enablement to the full central catalogue
 * (22 modules, 156 submodules — all catalogue leaves except Grants).
 *
 * Metadata + workspace_modules only. Does not seed data or change currency.
 *
 *   SUPABASE_ACCESS_TOKEN=... npx tsx scripts/update-saec-module-enablement.ts
 */
import {
  SAEC_ENABLED_MODULES,
  saecEnabledSubModules,
} from "../src/lib/platform-workspaces/saec-provisioning.ts";
import { SAEC_SLUG } from "../src/lib/saec-surface.ts";
import { setWorkspaceAdminRepositoryForTests } from "../src/lib/platform-workspaces/workspace-admin-repository-provider.ts";
import {
  getWorkspaceAdminRecord,
  updateWorkspaceAdminRecord,
} from "../src/lib/platform-workspaces/workspace-admin-service.ts";
import {
  buildWorkspaceProductNavSections,
  resolveWorkspaceNavEnablement,
} from "../src/lib/platform-workspaces/workspace-product-nav.ts";
import { WORKSPACE_MODULE_CATALOGUE } from "../src/lib/platform-workspaces/module-catalogue.ts";

const PROJECT_REF = "kkxtvzxqmbacjatkiupq";

async function fetchSupabaseCredentials(): Promise<{
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}> {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required.");
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch Supabase API keys: ${response.status}`);
  const keys = (await response.json()) as Array<{ name: string; api_key: string }>;
  const serviceRole = keys.find((key) => key.name === "service_role")?.api_key;
  const anon = keys.find((key) => key.name === "anon")?.api_key;
  if (!serviceRole || !anon) throw new Error("Supabase anon/service_role API keys not found.");
  return {
    url: `https://${PROJECT_REF}.supabase.co`,
    anonKey: anon,
    serviceRoleKey: serviceRole,
  };
}

async function runSql(query: string): Promise<unknown> {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required.");
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const body = await response.json();
  if (!response.ok) {
    throw new Error(typeof body?.message === "string" ? body.message : JSON.stringify(body));
  }
  return body;
}

function assertSaecNav(enabledModules: string[], enabledSubModules: string[]) {
  const enablement = resolveWorkspaceNavEnablement({
    workspaceSlug: SAEC_SLUG,
    workspaceType: "Customer",
    enabledModules,
    enabledSubModules,
  });
  const nav = buildWorkspaceProductNavSections({
    workspaceSlug: SAEC_SLUG,
    workspaceType: "Customer",
    enablement,
  });
  const labels = nav.flatMap((section) =>
    section.kind === "pin"
      ? section.items.map((item) => item.label)
      : section.label
        ? [section.label]
        : [],
  );

  if (labels.length !== WORKSPACE_MODULE_CATALOGUE.length) {
    throw new Error(`Expected ${WORKSPACE_MODULE_CATALOGUE.length} nav modules, got ${labels.length}`);
  }

  const required = [
    "Sales Management",
    "Fundraising",
    "Business Productivity",
    "Support Desk",
    "QMS",
    "Tools",
    "Settings",
  ];
  for (const label of required) {
    if (!labels.includes(label)) {
      throw new Error(`Navigation missing required module: ${label}`);
    }
  }

  const bc = nav.find((section) => section.label === "Business Central");
  const bcLabels =
    bc?.kind === "workspace"
      ? bc.items.flatMap((item) => [item.label, ...(item.children?.map((c) => c.label) ?? [])])
      : [];
  if (bcLabels.some((label) => label === "Grants")) {
    throw new Error("SAEC must not include Grants.");
  }

  const productivity = nav.find((section) => section.label === "Business Productivity");
  const productivityViews =
    productivity?.kind === "workspace"
      ? productivity.items.flatMap((item) =>
          item.view ? [item.view] : (item.children?.map((c) => c.view).filter(Boolean) ?? []),
        )
      : [];
  if (!productivityViews.includes("internal-work-packages")) {
    throw new Error("Internal Work Packages must appear under Business Productivity.");
  }
}

async function main() {
  const credentials = await fetchSupabaseCredentials();
  process.env.SUPABASE_URL = credentials.url;
  process.env.SUPABASE_ANON_KEY = credentials.anonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = credentials.serviceRoleKey;
  process.env.WORKSPACE_ADMIN_REPOSITORY = "supabase";
  setWorkspaceAdminRepositoryForTests(null);

  const workspaceRows = (await runSql(
    `select id, slug from public.workspaces where slug = '${SAEC_SLUG}' limit 1`,
  )) as Array<{ id: string; slug: string }>;
  const workspaceId = workspaceRows[0]?.id;
  if (!workspaceId) throw new Error("SAEC workspace not found.");

  const enabledModules = [...SAEC_ENABLED_MODULES];
  const enabledSubModules = saecEnabledSubModules();
  assertSaecNav(enabledModules, enabledSubModules);

  const before = await getWorkspaceAdminRecord(workspaceId);
  if (!before) throw new Error("SAEC workspace admin record not found.");

  console.log("Updating SAEC module enablement only...");
  console.log(`Before: ${before.enabledModules.length} modules, ${before.enabledSubModules.length} submodules`);

  const updated = await updateWorkspaceAdminRecord(workspaceId, {
    enabledModules,
    enabledSubModules,
  });

  console.log(`After: ${updated.enabledModules.length} modules, ${updated.enabledSubModules.length} submodules`);
  console.log(
    JSON.stringify(
      {
        workspaceId,
        slug: SAEC_SLUG,
        enabledModules: updated.enabledModules.length,
        enabledSubModules: updated.enabledSubModules.length,
        grantsExcluded: !updated.enabledSubModules.includes("business-central:grants"),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
