import { NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarMessagingOperators } from "@/lib/demo/northstar-messaging-fixtures";
import {
  applyGreenDesertMessagingOperatorPolicy,
  filterGreenDesertMessagingOperators,
} from "@/lib/greendesert/greendesert-messaging-operators";
import { isGreenDesertSlug } from "@/lib/greendesert-surface";
import { ensureInternalOperatorsTable } from "@/lib/internal-db-migrations";
import { listInternalOperators } from "@/lib/internal-operators-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { listWorkspaceTenantUsers } from "@/lib/platform-users-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createInitialUsers } from "@/lib/user-management-data";
import {
  applyWolfMessagingOperatorPolicy,
  filterWolfMessagingOperators,
} from "@/lib/wolf/wolf-messaging-operators";
import { isWolfCentralSlug } from "@/lib/wolf/wolf-surface";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

/**
 * Operators available for Messaging join / participants.
 * Any authenticated platform session can list Active operators (unlike /api/users which is admin-gated).
 */
export async function GET() {
  if (await isDemoApiRequest()) {
    return NextResponse.json({
      users: getNorthstarMessagingOperators(),
      source: "demo",
    });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();

    if (!isSupabaseConfigured()) {
      const users = applyGreenDesertMessagingOperatorPolicy(
        workspace.slug,
        applyWolfMessagingOperatorPolicy(
          workspace.slug,
          createInitialUsers().filter((user) => user.status === "Active"),
        ),
      );
      return NextResponse.json({
        users,
        source: "seed",
      });
    }

    await ensureInternalOperatorsTable();

    if (isWolfCentralSlug(workspace.slug)) {
      const users = (await listWorkspaceTenantUsers(workspace.id)).filter(
        (user) => user.status === "Active",
      );
      return NextResponse.json({
        users: filterWolfMessagingOperators(users),
      });
    }

    if (isGreenDesertSlug(workspace.slug)) {
      const users = (await listWorkspaceTenantUsers(workspace.id)).filter(
        (user) => user.status === "Active",
      );
      const filtered = filterGreenDesertMessagingOperators(
        users.length > 0
          ? users
          : createInitialUsers().filter((user) => user.status === "Active"),
      );
      return NextResponse.json({ users: filtered, source: "greendesert" });
    }

    const users = (await listInternalOperators()).filter((user) => user.status === "Active");
    const withFallback =
      users.length > 0
        ? users
        : createInitialUsers().filter((user) => user.status === "Active");

    return NextResponse.json({
      users: applyGreenDesertMessagingOperatorPolicy(
        workspace.slug,
        applyWolfMessagingOperatorPolicy(workspace.slug, withFallback),
      ),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load messaging operators";
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error, 500) });
  }
}
