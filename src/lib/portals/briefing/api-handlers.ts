import { NextRequest, NextResponse } from "next/server";

import { getRequestHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { getPlatformSession } from "@/lib/platform-session";
import { applyPortalsBriefingViewCookie } from "@/lib/portals/briefing/cookies";
import { readPortalsBriefingContent, writePortalsBriefingContent } from "@/lib/portals/briefing/content-service";
import { getPortalsBriefingPackBySlug } from "@/lib/portals/briefing/pack-registry";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Vary: "Cookie",
} as const;

function portalsJson(
  body: unknown,
  init: { status?: number; request?: NextRequest; refreshView?: boolean } = {},
) {
  const response = NextResponse.json(body, {
    status: init.status,
    headers: NO_STORE_HEADERS,
  });
  if (init.refreshView && init.request) {
    applyPortalsBriefingViewCookie(response, init.request);
  }
  return response;
}

function resolveWorkspaceSlugFromRequest(request: NextRequest): string | null {
  const host = getRequestHost(request);
  return parseClientPlatformSubdomainSafe(host);
}

export async function handleGetPortalsBriefingContent(
  request: NextRequest,
  workspaceSlugOverride?: string,
) {
  const workspaceSlug = workspaceSlugOverride ?? resolveWorkspaceSlugFromRequest(request);
  const pack = workspaceSlug ? getPortalsBriefingPackBySlug(workspaceSlug) : null;
  if (!pack?.briefing) {
    return portalsJson({ error: "Portals briefing not available for this host." }, { status: 404 });
  }

  const session = await getPlatformSession();
  if (!session || !pack.briefing.isAllowedUsername(session.username)) {
    return portalsJson({ error: "Authentication required." }, { status: 401 });
  }

  const content = await readPortalsBriefingContent(pack.slug);
  return portalsJson(
    {
      content,
      canEdit: pack.briefing.isAdminUsername(session.username),
      username: session.username,
    },
    { request, refreshView: true },
  );
}

export async function handlePutPortalsBriefingContent(
  request: NextRequest,
  workspaceSlugOverride?: string,
) {
  const workspaceSlug = workspaceSlugOverride ?? resolveWorkspaceSlugFromRequest(request);
  const pack = workspaceSlug ? getPortalsBriefingPackBySlug(workspaceSlug) : null;
  if (!pack?.briefing) {
    return portalsJson({ error: "Portals briefing not available for this host." }, { status: 404 });
  }

  const session = await getPlatformSession();
  if (!session) {
    return portalsJson({ error: "Authentication required." }, { status: 401 });
  }
  if (!pack.briefing.isAdminUsername(session.username)) {
    return portalsJson({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { content?: unknown };
    const content = await writePortalsBriefingContent(
      pack.slug,
      pack.briefing.sanitizeContent(body.content),
    );
    return portalsJson({ ok: true, content }, { request, refreshView: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save portals content.";
    return portalsJson({ error: message }, { status: 500 });
  }
}
