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

export async function GET() {
  const session = await getPlatformSession();
  if (!session || !isAbhiPortalsAllowedUsername(session.username)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const content = await readAbhiPortalsContent();
  return NextResponse.json({
    content,
    canEdit: isAbhiPortalsAdminUsername(session.username),
    username: session.username,
  });
}

export async function PUT(request: NextRequest) {
  const session = await getPlatformSession();
  if (!session || !isAbhiPortalsAdminUsername(session.username)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { content?: unknown };
    const content = await writeAbhiPortalsContent(sanitizePortalsContent(body.content));
    return NextResponse.json({ ok: true, content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save portals content.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
