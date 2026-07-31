import { NextRequest, NextResponse } from "next/server";

import { ensureSupportLoungeSchema, withSupportLoungeSchema } from "@/lib/internal-db-migrations";
import { runSupportLoungeChat, type LoungeChatMessage } from "@/lib/support-lounge-chat";
import { getLoungeClientByToken } from "@/lib/support-lounge-service";
import {
  applyLoungeRequesterCookie,
  readOrCreateLoungeRequesterId,
} from "@/lib/support-lounge-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { token } = await context.params;
    const body = (await request.json()) as {
      message?: string;
      history?: LoungeChatMessage[];
      activeTicketPublicToken?: string | null;
    };

    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: "Message is too long." }, { status: 400 });
    }

    await ensureSupportLoungeSchema();
    const lounge = await withSupportLoungeSchema(() => getLoungeClientByToken(token));
    if (!lounge) {
      return NextResponse.json({ error: "Support lounge not found." }, { status: 404 });
    }

    const session = await readOrCreateLoungeRequesterId(lounge.loungeToken);
    const history = Array.isArray(body.history)
      ? body.history
          .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .slice(-16)
      : [];

    const result = await withSupportLoungeSchema(() =>
      runSupportLoungeChat({
        lounge,
        requesterAnonId: session.requesterAnonId,
        history,
        userMessage: message,
        activeTicketPublicToken: body.activeTicketPublicToken,
        origin: request.nextUrl.origin,
      }),
    );

    const headers = new Headers();
    if (session.setCookie) {
      applyLoungeRequesterCookie(headers, session.setCookie);
    }

    return NextResponse.json({ ...result }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
