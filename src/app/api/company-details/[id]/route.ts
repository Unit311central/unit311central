import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import type { CompanyDetailsFields } from "@/lib/company-details-data";
import {
  COMPANY_DETAILS_MIGRATION_REQUIRED,
  archiveCompanyDetails,
  getCompanyDetailsById,
  updateCompanyDetails,
} from "@/lib/company-details-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  requireCurrentWorkspace,
  WorkspaceAccessError,
} from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function errorStatus(error: unknown): number {
  if (error instanceof WorkspaceAccessError) return error.status;
  const message = error instanceof Error ? error.message : "";
  if (message === COMPANY_DETAILS_MIGRATION_REQUIRED) return 503;
  if (message.includes("Authentication required")) return 401;
  if (message.includes("not found")) return 404;
  if (
    message.includes("required") ||
    message.includes("valid") ||
    message.includes("Invalid") ||
    message.includes("Archived")
  ) {
    return 400;
  }
  return 500;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const details = await getCompanyDetailsById(id, { workspaceId: workspace.id });
    if (!details || details.archivedAt) {
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }
    return NextResponse.json({ details });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load company";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const body = (await request.json()) as Partial<CompanyDetailsFields>;
    const details = await updateCompanyDetails(id, body, { workspaceId: workspace.id });
    return NextResponse.json({ details });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update company";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const details = await archiveCompanyDetails(id, { workspaceId: workspace.id });
    return NextResponse.json({ details });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to archive company";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}
