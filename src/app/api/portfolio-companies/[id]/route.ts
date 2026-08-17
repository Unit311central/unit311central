import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { getPlatformSession } from "@/lib/platform-session";
import {
  deletePortfolioCompany,
  updatePortfolioCompany,
  type PortfolioCompanyInput,
} from "@/lib/talanton/portfolio-companies-service";
import {
  WorkspaceAccessError,
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const workspace = await requireCurrentWorkspace();
    const body = (await request.json()) as PortfolioCompanyInput;
    if (!body?.name?.trim()) {
      return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    }
    const company = await updatePortfolioCompany(workspace.id, id, body);
    return NextResponse.json({ company });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to update portfolio company.";
    const status = /not found/i.test(message) ? 404 : apiErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const workspace = await requireCurrentWorkspace();
    await deletePortfolioCompany(workspace.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to delete portfolio company.";
    const status = /not found/i.test(message) ? 404 : apiErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
