/**
 * Provision WOLF Central workspace — wolf.unit311central.com
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=... WOLF_INITIAL_ADMIN_PASSWORD='...' npx tsx scripts/provision-wolf-central.ts
 */
import {
  wolfCentralEnabledModules,
  wolfCentralEnabledSubModules,
} from "../src/lib/wolf/wolf-central-provisioning.ts";
import {
  WOLF_CENTRAL_HOST_ALIAS,
  WOLF_CENTRAL_ORIGIN,
  WOLF_CENTRAL_SLUG,
  WOLF_DISPLAY_NAME,
  WOLF_TAGLINE,
} from "../src/lib/wolf/wolf-surface.ts";
import { workspaceCreateFixture } from "../src/lib/platform-workspaces/workspace-create-test-fixture.ts";
import {
  createWorkspaceAdminRecord,
  isWorkspaceSlugAvailable,
} from "../src/lib/platform-workspaces/workspace-admin-service.ts";
import { setWorkspaceAdminRepositoryForTests } from "../src/lib/platform-workspaces/workspace-admin-repository-provider.ts";
import { isWorkspaceProvisioningComplete } from "../src/lib/platform-workspaces/workspace-provisioning-orchestrator.ts";
import { registerWorkspaceHostAlias } from "../src/lib/platform-workspaces/workspace-host-alias-service.ts";
import { ensureWolfEstateSeed } from "../src/lib/wolf/central/estate-service.ts";

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

async function main() {
  const slugAvailable = await isWorkspaceSlugAvailable(WOLF_CENTRAL_SLUG);
  if (!slugAvailable) {
    throw new Error(
      `Workspace slug "${WOLF_CENTRAL_SLUG}" already exists. Refusing to reprovision.`,
    );
  }

  const credentials = await fetchSupabaseCredentials();
  process.env.SUPABASE_URL = credentials.url;
  process.env.SUPABASE_ANON_KEY = credentials.anonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = credentials.serviceRoleKey;
  process.env.WORKSPACE_ADMIN_REPOSITORY = "supabase";
  setWorkspaceAdminRepositoryForTests(null);

  const enabledModules = wolfCentralEnabledModules();
  const enabledSubModules = wolfCentralEnabledSubModules();
  const initialAdminPassword =
    process.env.WOLF_INITIAL_ADMIN_PASSWORD?.trim() ?? "WolfCentral2026$";

  console.log("Creating WOLF Central workspace...");
  const created = await createWorkspaceAdminRecord(
    workspaceCreateFixture({
      type: "Customer",
      name: WOLF_DISPLAY_NAME,
      slug: WOLF_CENTRAL_SLUG,
      companyName: WOLF_DISPLAY_NAME,
      contactName: "WOLF Administrator",
      contactEmail: "admin@wolf.unit311central.com",
      country: "South Africa",
      timezone: "Africa/Johannesburg",
      currency: "USD",
      description: `${WOLF_TAGLINE} — WOLF Central estate management platform.`,
      customerHostname: WOLF_CENTRAL_HOST_ALIAS,
      enabledModules,
      enabledSubModules,
      branding: {
        displayName: WOLF_DISPLAY_NAME,
        logoUrl: null,
        primaryColour: "#1a4d3a",
        secondaryColour: "#8b4513",
      },
      loginPage: {
        title: "WOLF Central",
        logoDataUrl: TINY_PNG,
        backgroundDataUrl: TINY_JPG,
      },
      initialAdministrator: {
        firstName: "WOLF",
        lastName: "Administrator",
        email: "admin@wolf.unit311central.com",
        password: initialAdminPassword,
        confirmPassword: initialAdminPassword,
      },
    }),
    "provision-wolf-central",
  );

  if (!isWorkspaceProvisioningComplete(created.provisioning)) {
    throw new Error(
      `Provisioning incomplete: ${created.provisioning.overallStatus} — ${created.provisioning.lastMessage ?? ""}`,
    );
  }

  await registerWorkspaceHostAlias({
    aliasSubdomain: WOLF_CENTRAL_HOST_ALIAS,
    workspaceId: created.workspaceId,
    workspaceSlug: WOLF_CENTRAL_SLUG,
  });

  await ensureWolfEstateSeed(created.workspaceId);

  console.log("\n=== WOLF Central workspace provisioned successfully ===");
  console.log(`Workspace ID: ${created.workspaceId}`);
  console.log(`Slug: ${created.slug}`);
  console.log(`Hostname: ${WOLF_CENTRAL_HOST_ALIAS}`);
  console.log(`Primary URL: ${WOLF_CENTRAL_ORIGIN}`);
  console.log(`Status: ${created.status}`);
  console.log(`Enabled modules: ${enabledModules.join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
