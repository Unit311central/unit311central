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
import { getPlatformSession } from "@/lib/platform-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Vary: "Cookie",
} as const;

function portalsJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function GET() {
  const session = await getPlatformSession();
  if (!session || !isAbhiPortalsAllowedUsername(session.username)) {
    return portalsJson({ error: "Authentication required." }, 401);
  }

  const content = await readAbhiPortalsContent();
  return portalsJson({
    content,
    canEdit: isAbhiPortalsAdminUsername(session.username),
    username: session.username,
  });
}

export async function PUT(request: NextRequest) {
  const session = await getPlatformSession();
  if (!session || !isAbhiPortalsAdminUsername(session.username)) {
    return portalsJson({ error: "Admin access required." }, 403);
  }

  try {
    const body = (await request.json()) as { content?: unknown };
    const content = await writeAbhiPortalsContent(sanitizePortalsContent(body.content));
    return portalsJson({ ok: true, content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save portals content.";
    return portalsJson({ error: message }, 500);
  }
}
