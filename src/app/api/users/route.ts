import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import {
  requireUsersModuleAdministratorSession,
} from "@/lib/internal-admin-auth";
import { createInternalOperator, listInternalOperators } from "@/lib/internal-operators-service";
import { listWorkspaceTenantUsers } from "@/lib/platform-users-service";
import { createWorkspaceTenantUser } from "@/lib/workspace-tenant-users-service";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { listAbhiTenantUsers } from "@/lib/abhi/users-data";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { listTalantonTenantUsers } from "@/lib/talanton/users-data";
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
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { listDemoWorkspaceUsers } from "@/lib/demo/demo-users-service";
import { isDemoWorkspaceSlug } from "@/lib/demo/read-only";

export const dynamic = "force-dynamic";

function isCustomerWorkspaceSlug(slug: string) {
  const normalized = slug.trim().toLowerCase();
  return (
    normalized.length > 0 &&
    normalized !== "unit311" &&
    normalized !== "internal" &&
    normalized !== "demo"
  );
}

export async function GET() {
  if (await isDemoApiRequest()) {
    return NextResponse.json({ users: await listDemoWorkspaceUsers() });
  }

  const auth = await requireUsersModuleAdministratorSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    if (isDemoWorkspaceSlug(auth.workspace.slug)) {
      return NextResponse.json({ users: await listDemoWorkspaceUsers() });
    }

    if (isCustomerWorkspaceSlug(auth.workspace.slug)) {
      const users = isTalantonImpactSlug(auth.workspace.slug)
        ? listTalantonTenantUsers()
        : isAbhiSlug(auth.workspace.slug)
          ? listAbhiTenantUsers()
          : await listWorkspaceTenantUsers(auth.workspace.id);
      return NextResponse.json({ users });
    }

    await ensureInternalOperatorsTable();
    const users = await listInternalOperators();
    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireUsersModuleAdministratorSession();
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

    if (isCustomerWorkspaceSlug(auth.workspace.slug)) {
      const result = await createWorkspaceTenantUser(
        auth.workspace.id,
        auth.workspace.name,
        {
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
          region: body.region,
          licenseId: body.licenseId,
          notes: body.notes,
          allowedViews: body.allowedViews,
          dashboardPrefs: body.dashboardPrefs,
          password: body.password,
        },
      );
      return NextResponse.json({ user: result.user, temporaryPassword: result.temporaryPassword });
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
