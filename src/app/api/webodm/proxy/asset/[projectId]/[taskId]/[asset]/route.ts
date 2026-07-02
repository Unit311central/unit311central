import { NextRequest, NextResponse } from "next/server";

import { isWebODMConfigured, proxyWebODM } from "@/lib/webodm-client";

export const dynamic = "force-dynamic";

const ASSET_CONTENT_TYPES: Record<string, string> = {
  "textured_model.glb": "model/gltf-binary",
  "dsm.tif": "image/tiff",
  "report.pdf": "application/pdf",
  "orthophoto.tif": "image/tiff",
  "georeferenced_model.laz": "application/octet-stream",
};

type RouteContext = {
  params: Promise<{ projectId: string; taskId: string; asset: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isWebODMConfigured()) {
    return NextResponse.json({ error: "WebODM is not configured." }, { status: 503 });
  }

  try {
    const { projectId, taskId, asset } = await context.params;
    const response = await proxyWebODM(
      `/api/projects/${projectId}/tasks/${taskId}/download/${asset}`,
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Asset not available." }, { status: response.status });
    }

    const body = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") ??
      ASSET_CONTENT_TYPES[asset] ??
      "application/octet-stream";

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": asset.endsWith(".pdf")
          ? `inline; filename="${asset}"`
          : `inline; filename="${asset}"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load asset." }, { status: 502 });
  }
}
