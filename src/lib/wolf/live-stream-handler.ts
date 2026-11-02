import { NextResponse } from "next/server";

import {
  getWolfHlsUpstreamUrl,
  rewriteWolfHlsPlaylist,
  wolfTestGroundUpstreamUrl,
} from "@/lib/wolf/live-stream-proxy";
import { fetchWolfHlsResource, getWolfHlsCdnSecret } from "@/lib/wolf/live-stream-upstream";
import { requireWolfCentralWorkspace } from "@/lib/wolf/wolf-central-auth";

async function safeUpstreamDetail(response: Response): Promise<string | null> {
  const text = (await response.text()).replace(/\s+/g, " ").trim();
  if (!text || text.length > 180 || /<html|bearer|token|secret/i.test(text)) return null;
  try {
    const parsed = JSON.parse(text) as { error?: unknown };
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error.trim().slice(0, 180);
    }
  } catch {
    return text;
  }
  return null;
}

export async function proxyWolfTestGroundHls(
  request: Request,
  path: string[] | undefined,
): Promise<NextResponse> {
  try {
    await requireWolfCentralWorkspace();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication required.";
    const status = message.includes("only available") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  const secret = getWolfHlsCdnSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "WOLF_HLS_CDN_SECRET is not configured" },
      { status: 503 },
    );
  }

  const requestUrl = new URL(request.url);
  const relativePath = (path ?? [])
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    })
    .join("/");
  const target = wolfTestGroundUpstreamUrl(relativePath, requestUrl.search);
  if (!target) {
    return NextResponse.json({ error: "Invalid stream path" }, { status: 400 });
  }

  const upstreamManifest = getWolfHlsUpstreamUrl();
  let upstream: Response;
  try {
    upstream = await fetchWolfHlsResource(target, upstreamManifest, secret);
  } catch {
    return NextResponse.json({ error: "Upstream stream unreachable" }, { status: 502 });
  }

  if (!upstream.ok) {
    const detail = await safeUpstreamDetail(upstream);
    return NextResponse.json(
      {
        error: "Upstream stream returned an error",
        upstreamStatus: upstream.status,
        ...(detail ? { detail } : {}),
      },
      { status: upstream.status },
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  if (relativePath.endsWith(".m3u8") || contentType.includes("mpegurl")) {
    const text = await upstream.text();
    return new NextResponse(rewriteWolfHlsPlaylist(text, upstreamManifest), {
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
