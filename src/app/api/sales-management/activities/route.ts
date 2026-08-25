import { NextResponse } from "next/server";

import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import {
  createSalesActivity,
  deleteSalesActivity,
  updateSalesActivity,
} from "@/lib/sales-management-service";
import { salesManagementErrorResponse } from "@/lib/sales-management-api";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!(await isSupabaseConfigured())) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }
    const blocked = await assertDemoMutationAllowedForRequest(request);
    if (blocked) return blocked;

    const session = await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const body = (await request.json()) as {
      crmLeadId?: string;
      title?: string;
      activityType?: string;
      subject?: string | null;
      message?: string | null;
      occurredAt?: string | null;
    };

    if (!body.crmLeadId?.trim() || !body.title?.trim()) {
      return NextResponse.json({ error: "crmLeadId and title are required." }, { status: 400 });
    }

    const activity = await createSalesActivity({
      workspaceId: workspace.id,
      crmLeadId: body.crmLeadId.trim(),
      title: body.title,
      activityType: body.activityType,
      subject: body.subject,
      message: body.message,
      occurredAt: body.occurredAt,
      createdBy: session.sub,
    });

    return NextResponse.json({ activity });
  } catch (error) {
    return salesManagementErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await isSupabaseConfigured())) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }
    const blocked = await assertDemoMutationAllowedForRequest(request);
    if (blocked) return blocked;

    const workspace = await requireCurrentWorkspace();
    const body = (await request.json()) as {
      id?: string;
      title?: string;
      subject?: string | null;
      message?: string | null;
      occurredAt?: string | null;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Activity id is required." }, { status: 400 });
    }

    const activity = await updateSalesActivity({
      workspaceId: workspace.id,
      activityId: body.id,
      title: body.title,
      subject: body.subject,
      message: body.message,
      occurredAt: body.occurredAt,
    });

    return NextResponse.json({ activity });
  } catch (error) {
    return salesManagementErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await isSupabaseConfigured())) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }
    const blocked = await assertDemoMutationAllowedForRequest(request);
    if (blocked) return blocked;

    const workspace = await requireCurrentWorkspace();
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ error: "Activity id is required." }, { status: 400 });
    }

    await deleteSalesActivity(workspace.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return salesManagementErrorResponse(error);
  }
}
