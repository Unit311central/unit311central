import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import {
  requireInternalAdministratorWorkspaceSession,
  requireUsersModuleAdministratorSession,
} from "@/lib/internal-admin-auth";
import {
  deleteInternalOperator,
  setInternalOperatorPassword,
  updateInternalOperator,
} from "@/lib/internal-operators-service";
import type {
  UserDashboardPrefs,
  UserDepartment,
  UserRegion,
  UserRole,
  UserStatus,
} from "@/lib/user-management-data";
import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  removeWorkspaceTenantUser,
  setWorkspaceTenantUserPassword,
  updateWorkspaceTenantUser,
  WorkspaceTenantUserError,
} from "@/lib/workspace-tenant-users-service";
import { isWorkspaceTenantAdministratorSurface } from "@/lib/customer-workspace-surface";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

type UserMutationBody = {
  operatorLabel?: string;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  roles?: UserRole[];
  department?: UserDepartment;
  departments?: UserDepartment[];
  status?: UserStatus;
  region?: UserRegion;
  licenseId?: string;
  notes?: string;
  allowedViews?: InternalOperationsView[] | null;
  dashboardPrefs?: UserDashboardPrefs | null;
};

function tenantUserErrorResponse(error: unknown) {
  if (error instanceof WorkspaceTenantUserError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Request failed";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireUsersModuleAdministratorSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as UserMutationBody;

    if (isWorkspaceTenantAdministratorSurface(auth.workspace.slug)) {
      const user = await updateWorkspaceTenantUser(
        auth.workspace.id,
        auth.workspace.name,
        id,
        body,
      );
      return NextResponse.json({ user });
    }

    const internalAuth = await requireInternalAdministratorWorkspaceSession();
    if ("error" in internalAuth) return internalAuth.error;

    const user = await updateInternalOperator(id, body);
    return NextResponse.json({ user });
  } catch (error) {
    return tenantUserErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireUsersModuleAdministratorSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { action?: string; password?: string };

    if (isWorkspaceTenantAdministratorSurface(auth.workspace.slug)) {
      if (body.action === "reset-password") {
        const result = await setWorkspaceTenantUserPassword(auth.workspace.id, id);
        return NextResponse.json({ temporaryPassword: result.password });
      }

      if (body.action === "set-password") {
        const result = await setWorkspaceTenantUserPassword(
          auth.workspace.id,
          id,
          body.password,
        );
        return NextResponse.json({ password: result.password });
      }

      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const internalAuth = await requireInternalAdministratorWorkspaceSession();
    if ("error" in internalAuth) return internalAuth.error;

    if (body.action === "reset-password") {
      const result = await setInternalOperatorPassword(id);
      return NextResponse.json({ temporaryPassword: result.password });
    }

    if (body.action === "set-password") {
      const result = await setInternalOperatorPassword(id, body.password);
      return NextResponse.json({ password: result.password });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    return tenantUserErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireUsersModuleAdministratorSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;

    if (isWorkspaceTenantAdministratorSurface(auth.workspace.slug)) {
      await removeWorkspaceTenantUser(auth.workspace.id, id, auth.session.sub);
      return NextResponse.json({ ok: true });
    }

    const internalAuth = await requireInternalAdministratorWorkspaceSession();
    if ("error" in internalAuth) return internalAuth.error;

    await deleteInternalOperator(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return tenantUserErrorResponse(error);
  }
}
