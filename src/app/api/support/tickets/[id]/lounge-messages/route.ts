import { NextRequest, NextResponse } from "next/server";

import { withSupportTicketsTable } from "@/lib/internal-db-migrations";
import { requirePlatformSession } from "@/lib/platform-session";
import { listLoungeAttachments, listLoungeMessages } from "@/lib/support-lounge-service";
import { getSupportTicket } from "@/lib/support-tickets-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function authErrorStatus(message: string) {
  return message.includes("Authentication required") || message.includes("Workspace context")
    ? 401
    : 500;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;

    const result = await withSupportTicketsTable(async () => {
      const ticket = await getSupportTicket(id, { workspaceId: workspace.id });
      if (!ticket) throw new Error("Support ticket not found.");
      const [messages, attachments] = await Promise.all([
        listLoungeMessages({ workspaceId: workspace.id, ticketId: id }),
        listLoungeAttachments({ workspaceId: workspace.id, ticketId: id }),
      ]);
      return { ticket, messages, attachments };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load lounge history";
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}
