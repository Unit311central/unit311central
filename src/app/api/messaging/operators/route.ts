import { NextResponse } from "next/server";

import { ensureInternalOperatorsTable } from "@/lib/internal-db-migrations";
import { listInternalOperators } from "@/lib/internal-operators-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createInitialUsers } from "@/lib/user-management-data";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

/**
 * Operators available for Messaging join / participants.
 * Any authenticated platform session can list Active operators (unlike /api/users which is admin-gated).
 */
export async function GET() {
  try {
    await requirePlatformSession();
    await requireCurrentWorkspace();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        users: createInitialUsers().filter((user) => user.status === "Active"),
        source: "seed",
      });
    }

    await ensureInternalOperatorsTable();
    const users = (await listInternalOperators()).filter((user) => user.status === "Active");
    const withFallback =
      users.length > 0
        ? users
        : createInitialUsers().filter((user) => user.status === "Active");

    return NextResponse.json({ users: withFallback });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load messaging operators";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
