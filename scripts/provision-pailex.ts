/**
 * Provision PAILEX customer workspace — pailex.unit311central.com
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=... PAILEX_INITIAL_ADMIN_PASSWORD='...' npx tsx scripts/provision-pailex.ts
 */
import {
  pailexEnabledModules,
  pailexEnabledSubModules,
} from "../src/lib/pailex/pailex-provisioning.ts";
import {
  PAILEX_COUNTRY,
  PAILEX_DISPLAY_NAME,
  PAILEX_HOST_ALIAS,
  PAILEX_ORIGIN,
  PAILEX_SLUG,
  PAILEX_TAGLINE,
  PAILEX_TIMEZONE,
} from "../src/lib/pailex/pailex-surface.ts";
import { workspaceCreateFixture } from "../src/lib/platform-workspaces/workspace-create-test-fixture.ts";
import {
  createWorkspaceAdminRecord,
  isWorkspaceSlugAvailable,
} from "../src/lib/platform-workspaces/workspace-admin-service.ts";
import { setWorkspaceAdminRepositoryForTests } from "../src/lib/platform-workspaces/workspace-admin-repository-provider.ts";
import { isWorkspaceProvisioningComplete } from "../src/lib/platform-workspaces/workspace-provisioning-orchestrator.ts";
import { registerWorkspaceHostAlias } from "../src/lib/platform-workspaces/workspace-host-alias-service.ts";
import { buildPailexNavSections } from "../src/lib/pailex/pailex-nav.ts";
import { resolveWorkspaceNavBaseSections } from "../src/lib/platform-workspaces/workspace-nav-resolver.ts";

const PROJECT_REF = "kkxtvzxqmbacjatkiupq";

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

function assertPailexNav() {
  const nav = buildPailexNavSections();
  const labels = nav
    .filter((section) => section.kind === "workspace")
    .map((section) => section.label);
  const required = [
    "Animals",
    "Containment",
    "Environment",
    "Fleet",
    "Drone Operations",
    "Support",
    "Training",
    "Projects",
    "Documents",
    "Settings",
  ];
  for (const label of required) {
    if (!labels.includes(label)) {
      throw new Error(`PAILEX nav missing section: ${label}`);
    }
  }
  const resolved = resolveWorkspaceNavBaseSections({ workspaceSlug: PAILEX_SLUG });
  if (resolved.length !== nav.length) {
    throw new Error("PAILEX nav resolver mismatch.");
  }
  console.log("PAILEX navigation verification passed.");
}

async function main() {
  const slugAvailable = await isWorkspaceSlugAvailable(PAILEX_SLUG);
  if (!slugAvailable) {
    throw new Error(`Workspace slug "${PAILEX_SLUG}" already exists. Refusing to reprovision.`);
  }

  const credentials = await fetchSupabaseCredentials();
  process.env.SUPABASE_URL = credentials.url;
  process.env.SUPABASE_ANON_KEY = credentials.anonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = credentials.serviceRoleKey;
  process.env.WORKSPACE_ADMIN_REPOSITORY = "supabase";
  setWorkspaceAdminRepositoryForTests(null);

  const enabledModules = pailexEnabledModules();
  const enabledSubModules = pailexEnabledSubModules();
  const initialAdminPassword =
    process.env.PAILEX_INITIAL_ADMIN_PASSWORD?.trim() ?? "PailexDemo2026$";

  assertPailexNav();

  console.log("Creating PAILEX workspace...");
  const created = await createWorkspaceAdminRecord(
    workspaceCreateFixture({
      type: "Customer",
      name: PAILEX_DISPLAY_NAME,
      slug: PAILEX_SLUG,
      companyName: PAILEX_DISPLAY_NAME,
      contactName: "PAILEX Administrator",
      contactEmail: "admin@pailex.unit311central.com",
      country: PAILEX_COUNTRY,
      timezone: PAILEX_TIMEZONE,
      currency: "ZAR",
      description: `${PAILEX_TAGLINE} — PAILEX demo reserve customer workspace.`,
      customerHostname: PAILEX_HOST_ALIAS,
      enabledModules,
      enabledSubModules,
      branding: {
        displayName: PAILEX_DISPLAY_NAME,
        logoUrl: null,
        primaryColour: "#1a4d3a",
        secondaryColour: "#8b4513",
      },
      loginPage: {
        title: "PAILEX Workspace",
        logoDataUrl: TINY_PNG,
        backgroundDataUrl: TINY_JPG,
      },
      initialAdministrator: {
        firstName: "PAILEX",
        lastName: "Administrator",
        email: "admin@pailex.unit311central.com",
        password: initialAdminPassword,
        confirmPassword: initialAdminPassword,
      },
    }),
    "provision-pailex",
  );

  if (!isWorkspaceProvisioningComplete(created.provisioning)) {
    throw new Error(
      `Provisioning incomplete: ${created.provisioning.overallStatus} — ${created.provisioning.lastMessage ?? ""}`,
    );
  }

  await registerWorkspaceHostAlias({
    aliasSubdomain: PAILEX_HOST_ALIAS,
    workspaceId: created.workspaceId,
    workspaceSlug: PAILEX_SLUG,
  });

  console.log("\n=== PAILEX workspace provisioned successfully ===");
  console.log(`Workspace ID: ${created.workspaceId}`);
  console.log(`Slug: ${created.slug}`);
  console.log(`Hostname: ${PAILEX_HOST_ALIAS}`);
  console.log(`Primary URL: ${PAILEX_ORIGIN}`);
  console.log(`Status: ${created.status}`);
  console.log(`Enabled modules: ${enabledModules.length}`);
  console.log(`Admin: admin@pailex.unit311central.com / ${initialAdminPassword}`);
  console.log(`Login: https://pailex.unit311central.com/login`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
