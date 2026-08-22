import { NextRequest, NextResponse } from "next/server";

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
  const auth = await requireTestWorkspaceAccess();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  try {
    const task = await getQaWorkspaceTask(auth.workspace.id, id);
    if (!task) return NextResponse.json({ error: "QA task not found." }, { status: 404 });
    return NextResponse.json({ task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load QA task.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireTestWorkspaceAccess();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  let body: Partial<QaWorkspaceTaskInput>;
  try {
    body = (await request.json()) as Partial<QaWorkspaceTaskInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const task = await updateQaWorkspaceTask(auth.workspace.id, id, body);
    return NextResponse.json({ task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update QA task.";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireTestWorkspaceAccess();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  try {
    await deleteQaWorkspaceTask(auth.workspace.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete QA task.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
