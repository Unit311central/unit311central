import { NextRequest, NextResponse } from "next/server";

import { requireTestWorkspaceAccess } from "@/lib/qa-workspace/auth";
import type { QaTaskStatus } from "@/lib/qa-workspace/constants";
import { createQaWorkspaceTask, listQaWorkspaceTasks } from "@/lib/qa-workspace/service";
import type { QaWorkspaceTaskInput } from "@/lib/qa-workspace/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireTestWorkspaceAccess();
  if ("error" in auth) return auth.error;

  const params = request.nextUrl.searchParams;
  const status = (params.get("status") ?? "all") as QaTaskStatus | "all";
  const moduleLabel = params.get("module") ?? undefined;
  const pageLabel = params.get("page") ?? undefined;
  const elementType = params.get("elementType") ?? undefined;

  try {
    const tasks = await listQaWorkspaceTasks(auth.workspace.id, {
      status,
      moduleLabel,
      pageLabel,
      elementType,
    });
    return NextResponse.json({ tasks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load QA tasks.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireTestWorkspaceAccess();
  if ("error" in auth) return auth.error;

  let body: QaWorkspaceTaskInput;
  try {
    body = (await request.json()) as QaWorkspaceTaskInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.moduleLabel?.trim() || !body.pageLabel?.trim() || !body.elementLabel?.trim()) {
    return NextResponse.json({ error: "Module, page, and element are required." }, { status: 400 });
  }
  if (!body.description?.trim()) {
    return NextResponse.json({ error: "Description is required." }, { status: 400 });
  }

  try {
    const task = await createQaWorkspaceTask(auth.workspace.id, body, {
      userId: auth.session.sub,
      email: auth.session.username,
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create QA task.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
