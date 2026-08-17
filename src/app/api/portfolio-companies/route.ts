import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { getPlatformSession } from "@/lib/platform-session";
import {
  createPortfolioCompany,
  ensurePortfolioCompaniesSeeded,
} from "@/lib/talanton/portfolio-companies-service";
import type { PortfolioCompanyInput } from "@/lib/talanton/portfolio-companies-service";
import {
  WorkspaceAccessError,
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const workspace = await requireCurrentWorkspace();
    const companies = await ensurePortfolioCompaniesSeeded({
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
    });
    return NextResponse.json({ companies });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to load portfolio companies.";
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const workspace = await requireCurrentWorkspace();
    const body = (await request.json()) as PortfolioCompanyInput;
    if (!body?.name?.trim()) {
      return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    }
    const company = await createPortfolioCompany(workspace.id, body);
    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to create portfolio company.";
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}
