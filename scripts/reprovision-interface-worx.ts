/**
 * One-off: archive the incorrectly provisioned Interface Worx workspace and
 * reprovision a fresh workspace with the same slug, hostname, and full module set.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=... INITIAL_ADMIN_PASSWORD='...' npx tsx scripts/reprovision-interface-worx.ts
 *
 * INITIAL_ADMIN_PASSWORD must be the exact password from the provisioning wizard.
 * Passwords are never stored in workspace metadata and cannot be recovered later.
 */
import {
  WORKSPACE_MODULE_IDS,
  defaultEnabledSubModules,
} from "../src/lib/platform-workspaces/module-catalogue.ts";
import { workspaceCreateFixture } from "../src/lib/platform-workspaces/workspace-create-test-fixture.ts";
import {
  archiveWorkspaceAdminRecord,
  createWorkspaceAdminRecord,
} from "../src/lib/platform-workspaces/workspace-admin-service.ts";
import { setWorkspaceAdminRepositoryForTests } from "../src/lib/platform-workspaces/workspace-admin-repository-provider.ts";
import {
  buildWorkspaceProductNavSections,
  resolveWorkspaceNavEnablement,
} from "../src/lib/platform-workspaces/workspace-product-nav.ts";
import { isWorkspaceProvisioningComplete } from "../src/lib/platform-workspaces/workspace-provisioning-orchestrator.ts";

const PROJECT_REF = "kkxtvzxqmbacjatkiupq";
const OLD_WORKSPACE_ID = "ff784b5b-70cc-454b-ab1f-ced3a25f7546";
const ARCHIVE_SUFFIX = "20260822";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const TINY_JPG =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

async function fetchSupabaseCredentials(): Promise<{
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}> {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("SUPABASE_ACCESS_TOKEN is required.");
  }
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch Supabase API keys: ${response.status}`);
  }
  const keys = (await response.json()) as Array<{ name: string; api_key: string }>;
  const serviceRole = keys.find((key) => key.name === "service_role")?.api_key;
  const anon = keys.find((key) => key.name === "anon")?.api_key;
  if (!serviceRole || !anon) {
    throw new Error("Supabase anon/service_role API keys not found.");
  }
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

async function freeInterfaceWorxIdentifiers(): Promise<void> {
  const archivedSlug = `interfaceworx-archived-${ARCHIVE_SUFFIX}`;
  const archivedHostname = archivedSlug;

  console.log("Archiving and renaming old Interface Worx workspace...");
  await runSql(`
    UPDATE workspaces
    SET slug = '${archivedSlug}', status = 'Archived', updated_at = now()
    WHERE id = '${OLD_WORKSPACE_ID}';
  `);

  await runSql(`
    UPDATE workspace_admin_metadata
    SET customer_hostname = '${archivedHostname}', updated_at = now()
    WHERE workspace_id = '${OLD_WORKSPACE_ID}';
  `);

  await runSql(`
    UPDATE platform_users
    SET
      email = 'admin+archived-${ARCHIVE_SUFFIX}@interfaceworx.com',
      username = 'admin+archived-${ARCHIVE_SUFFIX}@interfaceworx.com',
      is_active = false,
      updated_at = now()
    WHERE workspace_id = '${OLD_WORKSPACE_ID}';
  `);

  const archived = await archiveWorkspaceAdminRecord(OLD_WORKSPACE_ID);
  console.log(`Archived workspace status: ${archived.status}, slug: ${archived.slug}`);
}

function assertNavStructure(enabledModules: string[], enabledSubModules: string[]) {
  const enablement = resolveWorkspaceNavEnablement({
    workspaceSlug: "interfaceworx",
    workspaceType: "Customer",
    enabledModules,
    enabledSubModules,
  });
  const nav = buildWorkspaceProductNavSections({
    workspaceSlug: "interfaceworx",
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

  const required = [
    "Intelligence",
    "Fundraising",
    "Board",
    "Marketing & Events",
    "Project Management",
    "Engineering",
  ];
  for (const label of required) {
    if (!labels.includes(label)) {
      throw new Error(`Navigation missing required module: ${label}`);
    }
  }

  const bc = nav.find((section) => section.label === "Business Central");
  const bcItemLabels = bc?.items.map((item) => item.label) ?? [];
  if (bcItemLabels.includes("Projects")) {
    throw new Error("Business Central must not include Projects.");
  }
  if (!bcItemLabels.includes("Grants")) {
    throw new Error("Business Central must include Grants.");
  }

  const marketing = nav.find((section) => section.label === "Marketing & Events");
  if (!marketing?.items.some((item) => item.label === "Social")) {
    throw new Error("Social must be under Marketing & Events.");
  }

  const productivity = nav.find((section) => section.label === "Business Productivity");
  if (productivity?.items.some((item) => item.label === "Social")) {
    throw new Error("Social must not be under Business Productivity.");
  }

  console.log("Navigation structure verification passed.");
  console.log(`Top-level modules (${labels.length}): ${labels.join(" | ")}`);
}

async function main() {
  const credentials = await fetchSupabaseCredentials();
  process.env.SUPABASE_URL = credentials.url;
  process.env.SUPABASE_ANON_KEY = credentials.anonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = credentials.serviceRoleKey;
  process.env.WORKSPACE_ADMIN_REPOSITORY = "supabase";
  setWorkspaceAdminRepositoryForTests(null);

  await freeInterfaceWorxIdentifiers();

  const enabledModules = [...WORKSPACE_MODULE_IDS];
  const enabledSubModules = defaultEnabledSubModules(enabledModules);

  const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD?.trim();
  if (!initialAdminPassword) {
    throw new Error(
      "INITIAL_ADMIN_PASSWORD is required. Set it to the exact administrator password from the provisioning wizard.",
    );
  }

  console.log("Creating fresh Interface Worx workspace...");
  const created = await createWorkspaceAdminRecord(
    workspaceCreateFixture({
      type: "Customer",
      name: "Interface Worx",
      slug: "interfaceworx",
      companyName: "Interface Worx",
      contactName: "Paul Fotheringham",
      contactEmail: "admin@interfaceworx.com",
      country: "United Kingdom",
      timezone: "Europe/London",
      currency: "GBP",
      description: "Interface Worx customer workspace (reprovisioned after nav fix).",
      customerHostname: "interfaceworx",
      enabledModules,
      enabledSubModules,
      branding: {
        displayName: "Interface Worx",
        logoUrl: null,
        primaryColour: "#0b2d63",
        secondaryColour: "#2563eb",
      },
      loginPage: {
        title: "Interface Worx Workspace",
        logoDataUrl: TINY_PNG,
        backgroundDataUrl: TINY_JPG,
      },
      initialAdministrator: {
        firstName: "Paul",
        lastName: "Fotheringham",
        email: "admin@interfaceworx.com",
        password: initialAdminPassword,
        confirmPassword: initialAdminPassword,
      },
    }),
    "reprovision-interface-worx",
  );

  if (!isWorkspaceProvisioningComplete(created.provisioning)) {
    throw new Error(
      `Provisioning incomplete: ${created.provisioning.overallStatus} — ${created.provisioning.lastMessage ?? ""}`,
    );
  }

  assertNavStructure(created.enabledModules, created.enabledSubModules);

  console.log("\n=== Interface Worx reprovisioned successfully ===");
  console.log(`Workspace ID: ${created.workspaceId}`);
  console.log(`Slug: ${created.slug}`);
  console.log(`Hostname: ${created.customerHostname}`);
  console.log(`Primary URL: ${created.primaryUrl}`);
  console.log(`Status: ${created.status}`);
  console.log(`Modules: ${created.enabledModules.length}`);
  console.log(`Sub-modules: ${created.enabledSubModules.length}`);
  console.log(`Admin: ${created.initialAdministrator?.email}`);
  console.log(`Login title: ${created.loginPage.title}`);
  console.log(`Provisioning: ${created.provisioning.overallStatus}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
