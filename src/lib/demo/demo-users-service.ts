import { buildNorthstarDemoUsers } from "@/lib/demo/northstar-users-data";
import { ensureInternalOperatorsTable } from "@/lib/internal-db-migrations";
import { listInternalOperators } from "@/lib/internal-operators-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { ManagedUser } from "@/lib/user-management-data";

const DEMO_PLATFORM_ACCOUNT_USERNAMES = new Set([
  "admin@unit311central.com",
  "demo@unit311central.com",
]);

/** Northstar HR-linked users (25) plus workspace platform login accounts — not every internal operator row. */
export async function listDemoWorkspaceUsers(): Promise<ManagedUser[]> {
  const fixtures = buildNorthstarDemoUsers();
  if (!isSupabaseConfigured()) return fixtures;

  try {
    await ensureInternalOperatorsTable();
    const operators = await listInternalOperators();
    const fixtureUsernames = new Set(
      fixtures.map((user) => user.username.trim().toLowerCase()),
    );
    const extras = operators.filter((user) => {
      const username = user.username.trim().toLowerCase();
      if (fixtureUsernames.has(username)) return false;
      return DEMO_PLATFORM_ACCOUNT_USERNAMES.has(username);
    });
    return [...extras, ...fixtures];
  } catch {
    return fixtures;
  }
}
