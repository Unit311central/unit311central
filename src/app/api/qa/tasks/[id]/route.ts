import { NextRequest, NextResponse } from "next/server";

import { qaApiErrorResponse } from "@/lib/qa-workspace/api-error";
import { requireTestWorkspaceAccess } from "@/lib/qa-workspace/auth";
import {
  deleteQaWorkspaceTask,
  getQaWorkspaceTask,
  updateQaWorkspaceTask,
} from "@/lib/qa-workspace/service";
import type { QaWorkspaceTaskInput } from "@/lib/qa-workspace/types";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireTestWorkspaceAccess();
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    const task = await getQaWorkspaceTask(auth.workspace.id, id);
    if (!task) return NextResponse.json({ error: "QA task not found." }, { status: 404 });
    return NextResponse.json({ task });
  } catch (error) {
    return qaApiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireTestWorkspaceAccess();
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    let body: Partial<QaWorkspaceTaskInput>;
    try {
      body = (await request.json()) as Partial<QaWorkspaceTaskInput>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const task = await updateQaWorkspaceTask(auth.workspace.id, id, body);
    return NextResponse.json({ task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update QA task.";
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return qaApiErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireTestWorkspaceAccess();
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    await deleteQaWorkspaceTask(auth.workspace.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return qaApiErrorResponse(error);
  }
}
