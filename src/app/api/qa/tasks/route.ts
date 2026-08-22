import { NextRequest, NextResponse } from "next/server";

import { qaApiErrorResponse } from "@/lib/qa-workspace/api-error";
import { requireTestWorkspaceAccess } from "@/lib/qa-workspace/auth";
import type { QaTaskScope, QaTaskStatus } from "@/lib/qa-workspace/constants";
import { isQaTaskScope, validateQaWorkspaceTaskInput } from "@/lib/qa-workspace/scope";
import { createQaWorkspaceTask, listQaWorkspaceTasks } from "@/lib/qa-workspace/service";
import type { QaWorkspaceTaskInput } from "@/lib/qa-workspace/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTestWorkspaceAccess();
    if ("error" in auth) return auth.error;

    const params = request.nextUrl.searchParams;
    const status = (params.get("status") ?? "all") as QaTaskStatus | "all";
    const scopeParam = params.get("scope") ?? "all";
    const scope = scopeParam === "all" || isQaTaskScope(scopeParam) ? scopeParam : "all";
    const moduleLabel = params.get("module") ?? undefined;
    const pageLabel = params.get("page") ?? undefined;
    const elementType = params.get("elementType") ?? undefined;

    const tasks = await listQaWorkspaceTasks(auth.workspace.id, {
      status,
      scope: scope as QaTaskScope | "all",
      moduleLabel,
      pageLabel,
      elementType,
    });
    return NextResponse.json({ tasks });
  } catch (error) {
    return qaApiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTestWorkspaceAccess();
    if ("error" in auth) return auth.error;

    let body: QaWorkspaceTaskInput;
    try {
      body = (await request.json()) as QaWorkspaceTaskInput;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const validationError = validateQaWorkspaceTaskInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const task = await createQaWorkspaceTask(auth.workspace.id, body, {
      userId: auth.session.sub,
      email: auth.session.username,
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return qaApiErrorResponse(error);
  }
}
