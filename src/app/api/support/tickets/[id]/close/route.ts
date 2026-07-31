import { NextRequest, NextResponse } from "next/server";

import { getSupportTicket, updateSupportTicket } from "@/lib/support-tickets-service";
import { notifyClientTicketClosed } from "@/lib/support-client-notify";
import { withSupportTicketsTable } from "@/lib/internal-db-migrations";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function authErrorStatus(message: string) {
  return message.includes("Authentication required") || message.includes("Workspace context")
    ? 401
    : 500;
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const scope = { workspaceId: workspace.id };

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      preview?: boolean;
      notes?: string;
    };
    const preview = body.preview === true;
    const notes = body.notes?.trim() || "";

    if (!preview && notes.length < 3) {
      return NextResponse.json(
        { error: "Closing notes are required before closing a ticket." },
        { status: 400 },
      );
    }

    const result = await withSupportTicketsTable(async () => {
      const existing = await getSupportTicket(id, scope);
      if (!existing) throw new Error("Support ticket not found.");
      if (existing.closed) throw new Error("This ticket is already closed.");

      if (preview) {
        const ticket = await updateSupportTicket(
          id,
          { closed: true, archived: true, status: "closed" },
          scope,
        );
        return { ticket, clientMessage: notes || "Closed", emailed: false, whatsappSent: false };
      }

      const notify = await notifyClientTicketClosed(existing, notes, scope);
      const ticket = await updateSupportTicket(
        id,
        { closed: true, archived: true, status: "closed" },
        scope,
      );

      return {
        ticket,
        clientMessage: notes,
        emailed: Boolean(notify?.emailed),
        whatsappSent: Boolean(notify?.whatsappSent ?? notify?.ok),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to close ticket";
    const status = authErrorStatus(message) === 401 ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
