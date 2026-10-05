import { buildNorthstarDemoUsers } from "@/lib/demo/northstar-users-data";
import type { ManagedUser } from "@/lib/user-management-data";

/** Northstar demo fixtures only — isolated from live tenant identity / internal_operators. */
export async function listDemoWorkspaceUsers(): Promise<ManagedUser[]> {
  return buildNorthstarDemoUsers();
}
