import { NextResponse } from "next/server";

import { getInternalOperatorByUsername } from "@/lib/internal-operators-service";
import { getPlatformSession, type PlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { normalizeUserRole } from "@/lib/user-management-data";

const AUTH_REQUIRED = "Authentication required.";
const INSUFFICIENT_PRIVILEGES = "Insufficient privileges.";

/**
 * Authenticated internal user with operator role Admin.
 * 401 = no session; 403 = wrong user type or non-Admin role.
 */
export async function requireInternalAdministratorSession(): Promise<
  { error: NextResponse } | { session: PlatformSession }
> {
  const session = await getPlatformSession();
  if (!session) {
    return { error: NextResponse.json({ error: AUTH_REQUIRED }, { status: 401 }) };
  }

  if (session.userType !== "internal") {
    return {
      error: NextResponse.json({ error: INSUFFICIENT_PRIVILEGES }, { status: 403 }),
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      error: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }),
    };
  }

  try {
    const operator = await getInternalOperatorByUsername(session.username);
    if (!operator || normalizeUserRole(operator.role) !== "Admin") {
      return {
        error: NextResponse.json({ error: INSUFFICIENT_PRIVILEGES }, { status: 403 }),
      };
    }
  } catch {
    return {
      error: NextResponse.json({ error: INSUFFICIENT_PRIVILEGES }, { status: 403 }),
    };
  }

  return { session };
}
