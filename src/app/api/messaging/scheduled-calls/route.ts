import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarScheduledCalls } from "@/lib/demo/northstar-messaging-fixtures";
import { createScheduledCall, listScheduledCalls } from "@/lib/internal-messaging-service";
import { localListScheduledCalls } from "@/lib/internal-messaging-local-store";
import { INTERNAL_MESSAGING_ROOM } from "@/lib/internal-messaging-data";
import { ensureInternalOperatorsTable } from "@/lib/internal-db-migrations";
import { listInternalOperators } from "@/lib/internal-operators-service";
import { listWorkspaceTenantUsers } from "@/lib/platform-users-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  applyWolfMessagingOperatorIdPolicy,
  assertWolfMessagingOperatorIdAllowed,
} from "@/lib/wolf/wolf-messaging-operators";
import { isWolfCentralSlug } from "@/lib/wolf/wolf-surface";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

function authErrorStatus(message: string) {
  if (
    message.includes("Authentication required") ||
    message.includes("Workspace context")
  ) {
    return 401;
  }
  if (message.includes("not available for Messaging in WOLF Central")) {
    return 403;
  }
  return 500;
}

export async function GET(request: NextRequest) {
  const room = request.nextUrl.searchParams.get("room") ?? undefined;

  if (await isDemoApiRequest()) {
    return NextResponse.json({
      scheduledCalls: getNorthstarScheduledCalls(room),
      source: "demo",
    });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const scope = { workspaceId: workspace.id };

    const scheduledCalls = isSupabaseConfigured()
      ? await listScheduledCalls(room ?? undefined, scope)
      : localListScheduledCalls();
    return NextResponse.json({ scheduledCalls, source: isSupabaseConfigured() ? "supabase" : "local" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load scheduled calls";
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const scope = { workspaceId: workspace.id };

    const body = (await request.json()) as {
      room?: string;
      title?: string;
      scheduledAt?: string;
      participantOperatorIds?: string[];
      callLink?: string;
      callType?: "voice" | "video";
      createdByOperatorId?: string;
      createdByOperatorName?: string;
    };

    if (
      !body.title ||
      !body.scheduledAt ||
      !body.callLink ||
      !body.createdByOperatorId ||
      !body.createdByOperatorName
    ) {
      return NextResponse.json({ error: "Scheduled call details are incomplete." }, { status: 400 });
    }

    const messagingOperators = isWolfCentralSlug(workspace.slug)
      ? (await listWorkspaceTenantUsers(workspace.id)).filter((user) => user.status === "Active")
      : await (async () => {
          await ensureInternalOperatorsTable();
          return (await listInternalOperators()).filter((user) => user.status === "Active");
        })();
    assertWolfMessagingOperatorIdAllowed(
      workspace.slug,
      messagingOperators,
      body.createdByOperatorId,
    );
    const participantOperatorIds = applyWolfMessagingOperatorIdPolicy(
      workspace.slug,
      messagingOperators,
      body.participantOperatorIds ?? [],
    );

    const scheduledCall = await createScheduledCall(
      {
        room: body.room ?? INTERNAL_MESSAGING_ROOM,
        title: body.title,
        scheduledAt: body.scheduledAt,
        participantOperatorIds,
        callLink: body.callLink,
        callType: body.callType ?? "video",
        createdByOperatorId: body.createdByOperatorId,
        createdByOperatorName: body.createdByOperatorName,
      },
      scope,
    );

    return NextResponse.json({ scheduledCall });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to schedule call";
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}
