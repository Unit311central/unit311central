import "server-only";

import {
  wolfCentralEnabledModules,
  wolfCentralEnabledSubModules,
} from "@/lib/wolf/wolf-central-provisioning";
import {
  WOLF_CENTRAL_HOST_ALIAS,
  WOLF_CENTRAL_ORIGIN,
  WOLF_CENTRAL_SLUG,
  WOLF_DISPLAY_NAME,
  WOLF_TAGLINE,
} from "@/lib/wolf/wolf-surface";
import { workspaceCreateFixture } from "@/lib/platform-workspaces/workspace-create-test-fixture";
import {
  createWorkspaceAdminRecord,
  isWorkspaceSlugAvailable,
} from "@/lib/platform-workspaces/workspace-admin-service";
import { isWorkspaceProvisioningComplete } from "@/lib/platform-workspaces/workspace-provisioning-orchestrator";
import { registerWorkspaceHostAlias } from "@/lib/platform-workspaces/workspace-host-alias-service";
import { ensureWolfEstateSeed } from "@/lib/wolf/central/estate-service";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const TINY_JPG =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

export type ProvisionWolfCentralResult = {
  ok: true;
  workspaceId: string;
  slug: string;
  hostname: string;
  primaryUrl: string;
  status: string;
  enabledModules: string[];
  initialAdminEmail: string;
};

export async function provisionWolfCentralWorkspace(
  initialAdminPassword: string,
): Promise<ProvisionWolfCentralResult> {
  const password = initialAdminPassword.trim();
  if (!password) {
    throw new Error("WOLF_INITIAL_ADMIN_PASSWORD is required.");
  }

  const slugAvailable = await isWorkspaceSlugAvailable(WOLF_CENTRAL_SLUG);
  if (!slugAvailable) {
    throw new Error(
      `Workspace slug "${WOLF_CENTRAL_SLUG}" already exists. Refusing to reprovision.`,
    );
  }

  const enabledModules = wolfCentralEnabledModules();
  const enabledSubModules = wolfCentralEnabledSubModules();

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
        password,
        confirmPassword: password,
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

  return {
    ok: true,
    workspaceId: created.workspaceId,
    slug: created.slug,
    hostname: WOLF_CENTRAL_HOST_ALIAS,
    primaryUrl: WOLF_CENTRAL_ORIGIN,
    status: created.status,
    enabledModules,
    initialAdminEmail: "admin@wolf.unit311central.com",
  };
}
