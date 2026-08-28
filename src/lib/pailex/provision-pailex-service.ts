import "server-only";

import {
  pailexEnabledModules,
  pailexEnabledSubModules,
} from "@/lib/pailex/pailex-provisioning";
import {
  PAILEX_COUNTRY,
  PAILEX_DISPLAY_NAME,
  PAILEX_HOST_ALIAS,
  PAILEX_ORIGIN,
  PAILEX_SLUG,
  PAILEX_TAGLINE,
  PAILEX_TIMEZONE,
} from "@/lib/pailex/pailex-surface";
import { workspaceCreateFixture } from "@/lib/platform-workspaces/workspace-create-test-fixture";
import {
  createWorkspaceAdminRecord,
  isWorkspaceSlugAvailable,
} from "@/lib/platform-workspaces/workspace-admin-service";
import { isWorkspaceProvisioningComplete } from "@/lib/platform-workspaces/workspace-provisioning-orchestrator";
import { registerWorkspaceHostAlias } from "@/lib/platform-workspaces/workspace-host-alias-service";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const TINY_JPG =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

export type ProvisionPailexResult = {
  ok: true;
  workspaceId: string;
  slug: string;
  hostname: string;
  primaryUrl: string;
  status: string;
  enabledModules: string[];
  initialAdminEmail: string;
};

export async function provisionPailexWorkspace(
  initialAdminPassword: string,
): Promise<ProvisionPailexResult> {
  const password = initialAdminPassword.trim();
  if (!password) {
    throw new Error("PAILEX_INITIAL_ADMIN_PASSWORD is required.");
  }

  const slugAvailable = await isWorkspaceSlugAvailable(PAILEX_SLUG);
  if (!slugAvailable) {
    throw new Error(`Workspace slug "${PAILEX_SLUG}" already exists. Refusing to reprovision.`);
  }

  const enabledModules = pailexEnabledModules();
  const enabledSubModules = pailexEnabledSubModules();

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
      description: `${PAILEX_TAGLINE} — PAILEX demo reserve customer workspace (South Africa).`,
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
        password,
        confirmPassword: password,
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

  return {
    ok: true,
    workspaceId: created.workspaceId,
    slug: created.slug,
    hostname: PAILEX_HOST_ALIAS,
    primaryUrl: PAILEX_ORIGIN,
    status: created.status,
    enabledModules,
    initialAdminEmail: "admin@pailex.unit311central.com",
  };
}
