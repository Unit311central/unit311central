import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getOnwardAirClientPortalByPath } from "@/lib/onwardair/client-portal-routes";
import { isOverviewPortalAccessAllowed } from "@/lib/onwardair/overview-gate";
import {
  readOnwardAirOverviewContent,
  writeOnwardAirOverviewContent,
} from "@/lib/onwardair/overview-content-store";
import { sanitizeOverviewContent } from "@/lib/onwardair/overview-demo";
import { getPlatformSession } from "@/lib/platform-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Vary: "Cookie",
} as const;

function isOverviewSession(session: {
  userType: string;
  redirectPath: string;
  username: string;
}): boolean {
  if (session.userType !== "external") return false;
  const route = getOnwardAirClientPortalByPath(session.redirectPath);
  return route?.portalKind === "overview" || route?.path === "overview";
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function GET(_request: NextRequest) {
  const session = await getPlatformSession();
  const jar = await cookies();
  if (
    !session ||
    !isOverviewSession(session) ||
    !isOverviewPortalAccessAllowed({ cookies: jar }, { isFreshEntry: false })
  ) {
    return json({ error: "Authentication required." }, 401);
  }

  const content = await readOnwardAirOverviewContent();
  return json({
    content,
    canEdit: true,
    username: session.username,
  });
}

export async function PUT(request: NextRequest) {
  const session = await getPlatformSession();
  const jar = await cookies();
  if (
    !session ||
    !isOverviewSession(session) ||
    !isOverviewPortalAccessAllowed({ cookies: jar }, { isFreshEntry: false })
  ) {
    return json({ error: "Authentication required." }, 401);
  }

  try {
    const body = (await request.json()) as { content?: unknown };
    const content = await writeOnwardAirOverviewContent(sanitizeOverviewContent(body.content));
    return json({ ok: true, content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save overview content.";
    return json({ error: message }, 500);
  }
}
