import { NextResponse } from "next/server";

import { describeWhepUpstreamBody } from "@/lib/wolf/whep-failure";
import { requireWolfCentralWorkspace } from "@/lib/wolf/wolf-central-auth";
import { whepSessionPath } from "@/lib/wolf/webrtc-playback";

const MAX_SDP_BYTES = 128 * 1024;
const UPSTREAM_TIMEOUT_MS = 20_000;

function authFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "Authentication required.";
  const status = message.includes("only available") ? 403 : 401;
  return NextResponse.json({ error: message }, { status });
}

async function readSdp(request: Request): Promise<string | NextResponse> {
  const raw = await request.text();
  if (raw.length > MAX_SDP_BYTES) {
    return NextResponse.json({ error: "SDP offer is too large." }, { status: 413 });
  }
  if (!raw.includes("v=0")) {
    return NextResponse.json({ error: "Expected a WebRTC SDP offer." }, { status: 400 });
  }
  return raw;
}

function resolveOrFail(resolveTarget: () => string): string | NextResponse {
  try {
    return resolveTarget();
  } catch (error) {
    const message = error instanceof Error ? error.message : "WHEP URL is invalid.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function proxyWhepPost(
  request: Request,
  resolveTarget: () => string,
): Promise<NextResponse> {
  try {
    await requireWolfCentralWorkspace();
  } catch (error) {
    return authFailure(error);
  }

  const sdp = await readSdp(request);
  if (sdp instanceof NextResponse) return sdp;

  const target = resolveOrFail(resolveTarget);
  if (target instanceof NextResponse) return target;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: sdp,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return NextResponse.json(
      {
        error: "WHEP signalling endpoint is unreachable.",
        signallingUrl: target,
      },
      { status: 502 },
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const body = await upstream.text();
  const sessionPath = whepSessionPath(upstream.headers.get("location"));

  if ((upstream.status === 200 || upstream.status === 201) && contentType.includes("sdp")) {
    const headers = new Headers({
      "Content-Type": "application/sdp",
      "Cache-Control": "no-store",
      "X-Wolf-Whep-Url": target,
    });
    if (sessionPath) headers.set("X-Wolf-Whep-Session", sessionPath);
    return new NextResponse(body, { status: upstream.status, headers });
  }

  return NextResponse.json(
    {
      error: "WHEP signalling did not return an SDP answer.",
      upstreamStatus: upstream.status,
      signallingUrl: target,
      detail: describeWhepUpstreamBody(upstream.status, body),
    },
    { status: upstream.status === 404 ? 502 : upstream.status || 502 },
  );
}

export async function proxyWhepDelete(
  request: Request,
  resolveTarget: () => string,
): Promise<NextResponse> {
  try {
    await requireWolfCentralWorkspace();
  } catch (error) {
    return authFailure(error);
  }

  let sessionPath: string | null = null;
  try {
    const payload = (await request.json()) as { sessionPath?: unknown };
    sessionPath = whepSessionPath(
      typeof payload.sessionPath === "string" ? payload.sessionPath : null,
    );
  } catch {
    sessionPath = null;
  }
  if (!sessionPath) {
    return NextResponse.json({ error: "Unknown WHEP session." }, { status: 400 });
  }

  const resolved = resolveOrFail(resolveTarget);
  if (resolved instanceof NextResponse) return resolved;

  let target: URL;
  try {
    const whep = new URL(resolved);
    target = new URL(sessionPath, whep);
    if (target.origin !== whep.origin) {
      return NextResponse.json({ error: "Unknown WHEP session." }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "WHEP URL is invalid.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    await fetch(target, {
      method: "DELETE",
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    /* The page is already leaving the session. */
  }

  return new NextResponse(null, { status: 204 });
}
