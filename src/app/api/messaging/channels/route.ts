import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { listNorthstarMessagingChannels } from "@/lib/demo/northstar-messaging-fixtures";
import {
  createChannel,
  deleteChannel,
  ensureInternalOperationsChannel,
  listChannelsForViewer,
  markChannelRead,
  updateChannelMembers,
} from "@/lib/internal-messaging-service";
import {
  localCreateChannel,
  localDeleteChannel,
  localListChannelsForViewer,
  localMarkChannelRead,
  localUpdateChannelMembers,
} from "@/lib/internal-messaging-local-store";
import { ensureInternalOperatorsTable } from "@/lib/internal-db-migrations";
import { listInternalOperators } from "@/lib/internal-operators-service";
import { listWorkspaceTenantUsers } from "@/lib/platform-users-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { ensureTalantonMessagingChannelsSeeded } from "@/lib/talanton/messaging-seed";
import {
  applyWolfMessagingOperatorIdPolicy,
  assertWolfMessagingOperatorIdAllowed,
} from "@/lib/wolf/wolf-messaging-operators";
import { isWolfCentralSlug } from "@/lib/wolf/wolf-surface";

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

async function resolveMessagingOperatorsForPolicy(workspace: { id: string; slug: string }) {
  if (isWolfCentralSlug(workspace.slug)) {
    return (await listWorkspaceTenantUsers(workspace.id)).filter((user) => user.status === "Active");
  }
  if (!isSupabaseConfigured()) return [];
  await ensureInternalOperatorsTable();
  return (await listInternalOperators()).filter((user) => user.status === "Active");
}

export async function GET(request: NextRequest) {
  const viewerType = request.nextUrl.searchParams.get("viewerType");
  const operatorId = request.nextUrl.searchParams.get("operatorId") ?? undefined;
  const clientKey = request.nextUrl.searchParams.get("clientKey") ?? undefined;
  const viewerKey = request.nextUrl.searchParams.get("viewerKey") ?? operatorId ?? `client:${clientKey}`;

  if (await isDemoApiRequest()) {
    if (viewerType === "client") {
      if (!clientKey) {
        return NextResponse.json({ error: "clientKey is required." }, { status: 400 });
      }
      return NextResponse.json({
        channels: listNorthstarMessagingChannels({
          viewerType: "client",
          clientKey,
          viewerKey,
        }),
        source: "demo",
      });
    }

    const resolvedOperatorId = operatorId ?? "mag-dir-1";
    return NextResponse.json({
      channels: listNorthstarMessagingChannels({
        viewerType: "internal",
        operatorId: resolvedOperatorId,
        viewerKey: operatorId ?? viewerKey ?? resolvedOperatorId,
      }),
      source: "demo",
    });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const scope = { workspaceId: workspace.id };

    if (isTalantonImpactSlug(workspace.slug) && isSupabaseConfigured()) {
      await ensureTalantonMessagingChannelsSeeded(workspace.id).catch(() => undefined);
    }

    if (!isSupabaseConfigured()) {
      if (viewerType === "client") {
        if (!clientKey) {
          return NextResponse.json({ error: "clientKey is required." }, { status: 400 });
        }
        const channels = localListChannelsForViewer({
          viewerType: "client",
          clientKey,
          viewerKey,
        });
        return NextResponse.json({ channels, source: "local" });
      }

      const resolvedOperatorId = operatorId ?? "user-1";
      const channels = localListChannelsForViewer({
        viewerType: "internal",
        operatorId: resolvedOperatorId,
        viewerKey: operatorId ?? viewerKey ?? resolvedOperatorId,
      });
      return NextResponse.json({ channels, source: "local" });
    }

    if (viewerType === "client") {
      if (!clientKey) {
        return NextResponse.json({ error: "clientKey is required." }, { status: 400 });
      }
      const channels = await listChannelsForViewer(
        {
          viewerType: "client",
          clientKey,
          viewerKey,
        },
        scope,
      );
      return NextResponse.json({ channels });
    }

    if (viewerType === "internal") {
      const resolvedOperatorId = operatorId ?? "user-1";
      if (isSupabaseConfigured()) {
        await ensureInternalOperationsChannel(scope, {
          createdByOperatorId: resolvedOperatorId,
          createdByOperatorName: "Operator",
        }).catch(() => undefined);
      }
      const channels = await listChannelsForViewer(
        {
          viewerType: "internal",
          operatorId: resolvedOperatorId,
          viewerKey: operatorId ?? viewerKey ?? resolvedOperatorId,
        },
        scope,
      );
      return NextResponse.json({ channels });
    }

    if (isSupabaseConfigured()) {
      await ensureInternalOperationsChannel(scope).catch(() => undefined);
    }
    const channels = await listChannelsForViewer(
      {
        viewerType: "internal",
        operatorId: operatorId ?? "user-1",
        viewerKey: viewerKey,
      },
      scope,
    );
    return NextResponse.json({ channels });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load channels";
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const scope = { workspaceId: workspace.id };

    const body = (await request.json()) as {
      name?: string;
      channelType?: "internal" | "client";
      clientKey?: string;
      createdByOperatorId?: string;
      createdByOperatorName?: string;
      memberOperatorIds?: string[];
      memberClientUsernames?: string[];
      description?: string;
      isPrivate?: boolean;
    };

    if (!body.name || !body.createdByOperatorId || !body.createdByOperatorName) {
      return NextResponse.json({ error: "Channel name and creator are required." }, { status: 400 });
    }

    const messagingOperators = await resolveMessagingOperatorsForPolicy(workspace);
    assertWolfMessagingOperatorIdAllowed(
      workspace.slug,
      messagingOperators,
      body.createdByOperatorId,
    );
    const memberOperatorIds = applyWolfMessagingOperatorIdPolicy(
      workspace.slug,
      messagingOperators,
      body.memberOperatorIds ?? [],
    );

    const channel = isSupabaseConfigured()
      ? await createChannel(
          {
            name: body.name,
            channelType: body.channelType ?? "internal",
            clientKey: body.clientKey ?? null,
            createdByOperatorId: body.createdByOperatorId,
            createdByOperatorName: body.createdByOperatorName,
            memberOperatorIds,
            memberClientUsernames: body.memberClientUsernames,
            description: body.description,
            isPrivate: body.isPrivate,
          },
          scope,
        )
      : localCreateChannel({
          name: body.name,
          channelType: body.channelType ?? "internal",
          clientKey: body.clientKey ?? null,
          createdByOperatorId: body.createdByOperatorId,
          createdByOperatorName: body.createdByOperatorName,
          memberOperatorIds,
          memberClientUsernames: body.memberClientUsernames,
          description: body.description,
          isPrivate: body.isPrivate,
        });

    return NextResponse.json({ channel, source: isSupabaseConfigured() ? "supabase" : "local" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create channel";
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}

export async function PATCH(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const scope = { workspaceId: workspace.id };

    const body = (await request.json()) as {
      channelId?: string;
      memberOperatorIds?: string[];
      viewerKey?: string;
      room?: string;
      action?: "markRead";
    };

    if (body.action === "markRead" && body.viewerKey && body.room) {
      if (isSupabaseConfigured()) {
        await markChannelRead(body.viewerKey, body.room, scope);
      } else {
        localMarkChannelRead(body.viewerKey, body.room);
      }
      return NextResponse.json({ ok: true });
    }

    if (!body.channelId || !body.memberOperatorIds) {
      return NextResponse.json({ error: "Channel ID and members are required." }, { status: 400 });
    }

    const messagingOperators = await resolveMessagingOperatorsForPolicy(workspace);
    const memberOperatorIds = applyWolfMessagingOperatorIdPolicy(
      workspace.slug,
      messagingOperators,
      body.memberOperatorIds,
    );

    const channel = isSupabaseConfigured()
      ? await updateChannelMembers(body.channelId, memberOperatorIds, scope)
      : localUpdateChannelMembers(body.channelId, memberOperatorIds);
    return NextResponse.json({ channel });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update channel";
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}

export async function DELETE(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const scope = { workspaceId: workspace.id };
    const channelId = request.nextUrl.searchParams.get("channelId")?.trim();

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID is required." }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      await deleteChannel(channelId, scope);
    } else {
      localDeleteChannel(channelId);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete channel";
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}
