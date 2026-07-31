import { NextRequest, NextResponse } from "next/server";

import { ensureSupportLoungeSchema, withSupportLoungeSchema } from "@/lib/internal-db-migrations";
import { getLoungeClientByToken } from "@/lib/support-lounge-service";
import {
  applyLoungeRequesterCookie,
  readOrCreateLoungeRequesterId,
} from "@/lib/support-lounge-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { token } = await context.params;
    await ensureSupportLoungeSchema();
    const lounge = await withSupportLoungeSchema(() => getLoungeClientByToken(token));
    if (!lounge) {
      return NextResponse.json({ error: "Support lounge not found." }, { status: 404 });
    }

    const session = await readOrCreateLoungeRequesterId(lounge.loungeToken);
    const headers = new Headers();
    if (session.setCookie) {
      applyLoungeRequesterCookie(headers, session.setCookie);
    }

    return NextResponse.json(
      {
        lounge: {
          companyName: lounge.companyName,
          token: lounge.loungeToken,
        },
        requesterAnonId: session.requesterAnonId,
      },
      { headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load lounge";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
