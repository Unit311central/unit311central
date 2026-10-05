import { NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarMessagingOperators } from "@/lib/demo/northstar-messaging-fixtures";
import {
  applyGreenDesertMessagingOperatorPolicy,
  filterGreenDesertMessagingOperators,
} from "@/lib/greendesert/greendesert-messaging-operators";
import { isGreenDesertSlug } from "@/lib/greendesert-surface";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { listActiveMessagingOperatorsForWorkspace } from "@/lib/workspace-scoped-platform-users";
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

    const scopedUsers = await listActiveMessagingOperatorsForWorkspace(workspace.id);

    if (isWolfCentralSlug(workspace.slug)) {
      return NextResponse.json({
        users: filterWolfMessagingOperators(scopedUsers),
      });
    }

    if (isGreenDesertSlug(workspace.slug)) {
      const filtered = filterGreenDesertMessagingOperators(
        scopedUsers.length > 0
          ? scopedUsers
          : createInitialUsers().filter((user) => user.status === "Active"),
      );
      return NextResponse.json({ users: filtered, source: "greendesert" });
    }

    const withFallback =
      scopedUsers.length > 0
        ? scopedUsers
        : createInitialUsers().filter((user) => user.status === "Active");

    return NextResponse.json({
      users: applyGreenDesertMessagingOperatorPolicy(
        workspace.slug,
        applyWolfMessagingOperatorPolicy(workspace.slug, withFallback),
      ),
      source: "workspace",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load messaging operators";
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error, 500) });
  }
}
