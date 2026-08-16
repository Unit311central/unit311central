import { NextRequest, NextResponse } from "next/server";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { isDemoAdminUsername } from "@/lib/demo/read-only";
import { resolveDemoPreviewSlug } from "@/lib/demo/workspace-preview-server";
import {
  DEMO_PREVIEW_COOKIE,
  DEMO_PREVIEW_WORKSPACES,
  DEMO_WORKSPACE_SLUG,
  normalizeDemoPreviewSlug,
} from "@/lib/demo/workspace-preview";
import { getPlatformSession } from "@/lib/platform-session";
import { platformSessionCookieDomain, resolveUnit311CookieHost } from "@/lib/app-domains";

export const dynamic = "force-dynamic";

const PREVIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function previewCookieOptions(request: NextRequest) {
  const host = resolveUnit311CookieHost(request);
  const domain = platformSessionCookieDomain(host);
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: PREVIEW_COOKIE_MAX_AGE_SECONDS,
    ...(domain ? { domain } : {}),
  };
}

async function requireDemoAdmin() {
  if (!(await isDemoApiRequest())) {
    return NextResponse.json({ error: "Demo host only." }, { status: 403 });
  }
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!isDemoAdminUsername(session.username)) {
    return NextResponse.json(
      { error: "Only admin@unit311central.com can preview workspaces on Demo." },
      { status: 403 },
    );
  }
  return session;
}

export async function GET() {
  const gate = await requireDemoAdmin();
  if (gate instanceof NextResponse) return gate;

  const slug = await resolveDemoPreviewSlug();
  return NextResponse.json({
    slug,
    workspaces: DEMO_PREVIEW_WORKSPACES,
  });
}

export async function POST(request: NextRequest) {
  const gate = await requireDemoAdmin();
  if (gate instanceof NextResponse) return gate;

  let body: { slug?: string | null } = {};
  try {
    body = (await request.json()) as { slug?: string | null };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const slug = normalizeDemoPreviewSlug(body.slug) ?? DEMO_WORKSPACE_SLUG;
  const response = NextResponse.json({
    slug,
    workspaces: DEMO_PREVIEW_WORKSPACES,
  });

  if (slug === DEMO_WORKSPACE_SLUG) {
    response.cookies.set(DEMO_PREVIEW_COOKIE, "", {
      ...previewCookieOptions(request),
      maxAge: 0,
    });
    return response;
  }

  response.cookies.set(DEMO_PREVIEW_COOKIE, slug, previewCookieOptions(request));
  return response;
}
