import { NextRequest, NextResponse } from "next/server";

import {
  hydrateArtifactFromMessagePayload,
  loadArtifactBytes,
} from "@/lib/ai-operating-assistant/artifact-store";
import { getConversationForUser } from "@/lib/ai-operating-assistant/conversation-service";
import { getPlatformSession } from "@/lib/platform-session";
import { isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function resolveArtifact(id: string, userId: string) {
  const loaded = await loadArtifactBytes(id, userId);
  if (loaded) return loaded;

  if (!isSupabaseServiceRoleConfigured()) return null;

  // Recover base64 from the user's saved conversations when serverless memory is cold.
  try {
    const { listConversationsForUser } = await import(
      "@/lib/ai-operating-assistant/conversation-service"
    );
    const conversations = await listConversationsForUser({ userId, limit: 30 });
    for (const conversation of conversations) {
      const full =
        (await getConversationForUser(conversation.id, userId)) ?? conversation;
      for (const message of full.messages) {
        const match = message.artifacts?.find((artifact) => artifact.id === id);
        if (match?.contentBase64) {
          return hydrateArtifactFromMessagePayload({
            id: match.id,
            title: match.title,
            filename: match.filename,
            userId,
            contentBase64: match.contentBase64,
          });
        }
      }
    }
  } catch {
    return null;
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
