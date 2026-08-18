import { getNorthstarDemoUsers } from "@/lib/demo/northstar-api-fixtures";
import { ensureInternalOperatorsTable } from "@/lib/internal-db-migrations";
import { listInternalOperators } from "@/lib/internal-operators-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { ManagedUser } from "@/lib/user-management-data";

/** Northstar fixture users plus any real operators created on Demo (e.g. admin@). */
export async function listDemoWorkspaceUsers(): Promise<ManagedUser[]> {
  const fixtures = getNorthstarDemoUsers();
  if (!isSupabaseConfigured()) return fixtures;

  try {
    await ensureInternalOperatorsTable();
    const operators = await listInternalOperators();
    const fixtureUsernames = new Set(
      fixtures.map((user) => user.username.trim().toLowerCase()),
    );
    const extras = operators.filter(
      (user) => !fixtureUsernames.has(user.username.trim().toLowerCase()),
    );
    return [...extras, ...fixtures];
  } catch {
    return fixtures;
  }
}
