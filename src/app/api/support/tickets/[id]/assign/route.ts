import { NextRequest, NextResponse } from "next/server";

import { withSupportTicketsTable } from "@/lib/internal-db-migrations";
import { ensureClientSupportChannel } from "@/lib/support-channel";
import { notifyClientTicketAssigned } from "@/lib/support-client-notify";
import { getSupportTicket, updateSupportTicket } from "@/lib/support-tickets-service";
import { sendMessage } from "@/lib/internal-messaging-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const scope = { workspaceId: workspace.id };
    const { id } = await context.params;
    const body = (await request.json()) as {
      assignee?: string;
      room?: string | null;
    };
    const assignee = body.assignee?.trim();
    if (!assignee) {
      return NextResponse.json({ error: "Assignee is required." }, { status: 400 });
    }

    const result = await withSupportTicketsTable(async () => {
      const existing = await getSupportTicket(id, scope);
      if (!existing) throw new Error("Support ticket not found.");

      const ticket = await updateSupportTicket(id, { userAssigned: assignee }, scope);
      if (assignee !== (existing.userAssigned || "").trim()) {
        await notifyClientTicketAssigned(ticket, assignee).catch(() => null);
      }

      let room = body.room?.trim() || "";
      if (!room) {
        const channel = await ensureClientSupportChannel({
          companyName: ticket.organisation || "Client",
          clientId: ticket.clientId,
          scope,
        });
        room = channel.room;
      }

      await sendMessage(
        {
          operatorId: "system",
          operatorName: "Unit311 Support",
          username: "system",
          content: `${assignee} assigned to ${ticket.id}.`,
          room,
          messageType: "system",
        },
        scope,
      ).catch((error) => {
        console.warn("[support/assign] channel notify failed:", error);
      });

      return { ticket, room };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to assign ticket";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : message.includes("not found")
          ? 404
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
