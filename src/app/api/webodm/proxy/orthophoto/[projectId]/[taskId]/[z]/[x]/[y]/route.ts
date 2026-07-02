import { NextRequest, NextResponse } from "next/server";

import { isWebODMConfigured, proxyWebODM } from "@/lib/webodm-client";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ projectId: string; taskId: string; z: string; x: string; y: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isWebODMConfigured()) {
    return NextResponse.json({ error: "WebODM is not configured." }, { status: 503 });
  }

  try {
    const { projectId, taskId, z, x, y } = await context.params;
    const response = await proxyWebODM(
      `/api/projects/${projectId}/tasks/${taskId}/orthophoto/tiles/${z}/${x}/${y}`,
    );

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const body = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "image/png";

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load orthophoto tile." }, { status: 502 });
  }
}
