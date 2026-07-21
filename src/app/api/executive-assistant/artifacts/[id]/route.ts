import { NextRequest, NextResponse } from "next/server";

import { getAssistantArtifact } from "@/lib/ai-operating-assistant/artifact-store";
import { getPlatformSession } from "@/lib/platform-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;
  const artifact = getAssistantArtifact(id, session.sub);
  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found." }, { status: 404 });
  }

  const disposition =
    request.nextUrl.searchParams.get("disposition") === "inline" ? "inline" : "attachment";

  return new NextResponse(new Uint8Array(artifact.bytes), {
    status: 200,
    headers: {
      "Content-Type": artifact.mimeType,
      "Content-Disposition": `${disposition}; filename="${artifact.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
