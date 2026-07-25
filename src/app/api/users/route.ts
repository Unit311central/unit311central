import { NextRequest, NextResponse } from "next/server";

import { requireInternalAdministratorWorkspaceSession } from "@/lib/internal-admin-auth";
import { createInternalOperator, listInternalOperators } from "@/lib/internal-operators-service";
import { ensureInternalOperatorsTable } from "@/lib/internal-db-migrations";
import type {
  UserDashboardPrefs,
  UserDepartment,
  UserRegion,
  UserRole,
  UserStatus,
} from "@/lib/user-management-data";
import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireInternalAdministratorWorkspaceSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await ensureInternalOperatorsTable();
    const users = await listInternalOperators();
    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireInternalAdministratorWorkspaceSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      operatorLabel?: string;
      fullName?: string;
      username?: string;
      email?: string;
      phone?: string;
      role?: string;
      roles?: string[];
      department?: string;
      departments?: string[];
      status?: string;
      region?: string;
      licenseId?: string;
      notes?: string;
      allowedViews?: InternalOperationsView[] | null;
      dashboardPrefs?: UserDashboardPrefs | null;
      password?: string;
    };

    if (!body.fullName?.trim() || !(body.username?.trim() || body.email?.trim())) {
      return NextResponse.json(
        { error: "Full name and email/username are required" },
        { status: 400 },
      );
    }

    await ensureInternalOperatorsTable();
    const result = await createInternalOperator({
      operatorLabel: body.operatorLabel,
      fullName: body.fullName,
      username: (body.username || body.email)!,
      email: body.email,
      phone: body.phone,
      role: body.role as UserRole | undefined,
      roles: body.roles as UserRole[] | undefined,
      department: body.department as UserDepartment | undefined,
      departments: body.departments as UserDepartment[] | undefined,
      status: body.status as UserStatus | undefined,
      region: body.region as UserRegion | undefined,
      licenseId: body.licenseId,
      notes: body.notes,
      allowedViews: body.allowedViews,
      dashboardPrefs: body.dashboardPrefs,
      password: body.password,
    });
    return NextResponse.json({ user: result.user, temporaryPassword: result.temporaryPassword });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
