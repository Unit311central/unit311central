import { NextRequest, NextResponse } from "next/server";

import { applyAbhiPortalsViewCookie } from "@/lib/platform-session-cookie";
import { getPlatformSession } from "@/lib/platform-session";
import {
  readTalantonPortalsContent,
  writeTalantonPortalsContent,
} from "@/lib/talanton/portals-content-store";
import {
  isTalantonPortalsAdminUsername,
  isTalantonPortalsAllowedUsername,
  sanitizePortalsContent,
} from "@/lib/talanton/portals-demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Vary: "Cookie",
} as const;

function portalsJson(
  body: unknown,
  init: { status?: number; request?: NextRequest; refreshView?: boolean } = {},
) {
  const response = NextResponse.json(body, {
    status: init.status,
    headers: NO_STORE_HEADERS,
  });
  if (init.refreshView && init.request) {
    applyAbhiPortalsViewCookie(response, init.request);
  }
  return response;
}

export async function GET(request: NextRequest) {
  const session = await getPlatformSession();
  if (!session || !isTalantonPortalsAllowedUsername(session.username)) {
    return portalsJson({ error: "Authentication required." }, { status: 401 });
  }

  const content = await readTalantonPortalsContent();
  return portalsJson(
    {
      content,
      canEdit: isTalantonPortalsAdminUsername(session.username),
      username: session.username,
    },
    { request, refreshView: true },
  );
}

export async function PUT(request: NextRequest) {
  const session = await getPlatformSession();
  if (!session) {
    return portalsJson({ error: "Authentication required." }, { status: 401 });
  }
  if (!isTalantonPortalsAdminUsername(session.username)) {
    return portalsJson({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { content?: unknown };
    const content = await writeTalantonPortalsContent(sanitizePortalsContent(body.content));
    return portalsJson({ ok: true, content }, { request, refreshView: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save portals content.";
    return portalsJson({ error: message }, { status: 500 });
  }
}
