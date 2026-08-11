import { NextRequest, NextResponse } from "next/server";

import {
  hydrateArtifactFromMessagePayload,
  loadArtifactBytes,
} from "@/lib/ai-operating-assistant/artifact-store";
import { findArtifactInUserConversations } from "@/lib/ai-operating-assistant/conversation-service";
import { getPlatformSession } from "@/lib/platform-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function resolveArtifact(id: string, userId: string) {
  const loaded = await loadArtifactBytes(id, userId);
  if (loaded) return loaded;

  const fromConversation = await findArtifactInUserConversations(userId, id);
  if (fromConversation) {
    return hydrateArtifactFromMessagePayload({
      id: fromConversation.id,
      title: fromConversation.title,
      filename: fromConversation.filename,
      userId,
      contentBase64: fromConversation.contentBase64,
      kind: fromConversation.kind,
    });
  }

  return null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;
  const artifact = await resolveArtifact(id, session.sub);
  if (!artifact) {
    return NextResponse.json(
      { error: "Artifact not found. Generate the PDF again." },
      { status: 404 },
    );
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
