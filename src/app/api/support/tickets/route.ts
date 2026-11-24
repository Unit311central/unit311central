import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarSupportTickets } from "@/lib/demo/northstar-api-fixtures";
import { createSupportTicket, listSupportTickets } from "@/lib/support-tickets-service";
import { listInternalClients } from "@/lib/internal-clients-service";
import {
  requestTargetsWolfSentinel,
  supportTicketsVisibleOnWolfSentinel,
} from "@/lib/wolf/wolf-sentinel";
import type { SupportTicketPriority } from "@/lib/support-data";
import {
  ensureSupportLoungeSchema,
  ensureSupportTicketsTable,
  withSupportTicketsTable,
} from "@/lib/internal-db-migrations";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

function authErrorStatus(message: string) {
  return message.includes("Authentication required") || message.includes("Workspace context")
    ? 401
    : 500;
}

function isSchemaWarmupError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /could not find|does not exist|schema cache|column .* not found/i.test(message);
}

export async function GET(request: NextRequest) {
  if (await isDemoApiRequest()) {
    return NextResponse.json({ tickets: getNorthstarSupportTickets() });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const scope = { workspaceId: workspace.id };
    const includeArchived = request.nextUrl.searchParams.get("includeArchived") !== "false";

    // Fast path: list immediately. Schema ensure only on cold miss / missing columns.
    const visibleTickets = async (tickets: Awaited<ReturnType<typeof listSupportTickets>>) => {
      if (!requestTargetsWolfSentinel(request.headers)) return tickets;
      const clients = await listInternalClients({
        workspaceId: workspace.id,
        workspaceSlug: workspace.slug,
      });
      const wolfClientIds = new Set(
        clients.filter((client) => client.clientType === "wolf").map((client) => client.id),
      );
      return supportTicketsVisibleOnWolfSentinel(tickets, wolfClientIds);
    };

    try {
      const tickets = await visibleTickets(await listSupportTickets(includeArchived, scope));
      return NextResponse.json({ tickets });
    } catch (listError) {
      if (!isSchemaWarmupError(listError)) throw listError;
      await Promise.all([ensureSupportTicketsTable(), ensureSupportLoungeSchema()]);
      const tickets = await visibleTickets(
        await withSupportTicketsTable(() => listSupportTickets(includeArchived, scope)),
      );
      return NextResponse.json({ tickets });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load support tickets";
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
      name?: string;
      organisation?: string;
      priority?: SupportTicketPriority;
      description?: string;
      userAssigned?: string | null;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const name = body.name.trim();
    try {
      const ticket = await createSupportTicket(
        {
          ...body,
          name,
        },
        scope,
      );
      return NextResponse.json({ ticket });
    } catch (createError) {
      if (!isSchemaWarmupError(createError)) throw createError;
      await Promise.all([ensureSupportTicketsTable(), ensureSupportLoungeSchema()]);
      const ticket = await withSupportTicketsTable(() =>
        createSupportTicket(
          {
            ...body,
            name,
          },
          scope,
        ),
      );
      return NextResponse.json({ ticket });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create support ticket";
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}
