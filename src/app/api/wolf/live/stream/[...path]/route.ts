import { NextResponse } from "next/server";

import {
  rewriteWolfCloudPlaylist,
  wolfTestGroundUpstreamUrl,
} from "@/lib/wolf/live-stream-proxy";
import { requireWolfCentralWorkspace } from "@/lib/wolf/wolf-central-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    await requireWolfCentralWorkspace();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication required.";
    const status = message.includes("only available") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  const { path } = await context.params;
  const requestUrl = new URL(request.url);
  const relativePath = (path ?? []).map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return part;
    }
  }).join("/");
  const target = wolfTestGroundUpstreamUrl(relativePath, requestUrl.search);
  if (!target) {
    return NextResponse.json({ error: "Invalid stream path" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, { cache: "no-store", redirect: "follow" });
  } catch {
    return NextResponse.json({ error: "Upstream stream unreachable" }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Upstream stream returned an error" },
      { status: upstream.status },
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  if (relativePath.endsWith(".m3u8") || contentType.includes("mpegurl")) {
    const text = await upstream.text();
    return new NextResponse(rewriteWolfCloudPlaylist(text), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(await upstream.arrayBuffer(), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
