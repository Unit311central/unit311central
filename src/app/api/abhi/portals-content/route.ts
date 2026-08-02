import { NextRequest, NextResponse } from "next/server";

import {
  isAbhiPortalsAdminUsername,
  isAbhiPortalsAllowedUsername,
  sanitizePortalsContent,
} from "@/lib/abhi/portals-demo";
import {
  readAbhiPortalsContent,
  writeAbhiPortalsContent,
} from "@/lib/abhi/portals-content-store";
import { applyAbhiPortalsViewCookie } from "@/lib/platform-session-cookie";
import { getPlatformSession } from "@/lib/platform-session";

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
  if (!session || !isAbhiPortalsAllowedUsername(session.username)) {
    return portalsJson({ error: "Authentication required." }, { status: 401 });
  }

  const content = await readAbhiPortalsContent();
  return portalsJson(
    {
      content,
      canEdit: isAbhiPortalsAdminUsername(session.username),
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
  if (!isAbhiPortalsAdminUsername(session.username)) {
    return portalsJson({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { content?: unknown };
    const content = await writeAbhiPortalsContent(sanitizePortalsContent(body.content));
    return portalsJson({ ok: true, content }, { request, refreshView: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save portals content.";
    return portalsJson({ error: message }, { status: 500 });
  }
}
