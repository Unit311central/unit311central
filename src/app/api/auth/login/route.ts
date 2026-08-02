import { NextRequest, NextResponse } from "next/server";

import {
  PLATFORM_SESSION_MAX_AGE_SECONDS,
  createPlatformSessionToken,
  normalizePlatformUsername,
  type PlatformSession,
} from "@/lib/platform-auth";
import { applyPlatformSessionCookie, applyAbhiPortalsGateCookie } from "@/lib/platform-session-cookie";
import {
  DEMO_WORKSPACE_SLUG,
  DEMO_SITE_URL,
  INTERNAL_SITE_URL,
  customerWorkspaceOrigin,
  getRequestHost,
  isDemoDomainHost,
  isInternalDomainHost,
  parseClientPlatformSubdomainSafe,
  parseLoginReturnTo,
  parseSafePostLoginNext,
  parseValidWorkspaceReturnTo,
  resolveBrowserRedirectPathForHost,
  workspacePostLoginUrl,
} from "@/lib/app-domains";
import { loginPlatformUser } from "@/lib/platform-users-service";
import { recordPlatformUserLogin } from "@/lib/external-platform-users-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { resolveTalantonCompanyPortalPostLoginUrl } from "@/lib/talanton/company-portal-login";
import { resolveAbhiMemberPortalPostLoginUrl } from "@/lib/abhi/member-portal-login";
import {
  ABHI_DEMO_PLATFORM_USERNAME,
  ABHI_PORTALS_ADMIN_USERNAME,
  ABHI_PORTALS_SHARED_PASSWORD,
  isAbhiPortalsAllowedUsername,
} from "@/lib/abhi/portals-demo";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { workspaceNeedsCustomerOnboarding } from "@/lib/workspace-customer-onboarding-service";
import {
  INTERNAL_WORKSPACE_SLUG,
  resolveWorkspaceBinding,
  withSessionWorkspace,
} from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

const DEMO_LOGIN = {
  username: "client",
  password: "client",
  redirectPath: "/",
  userId: "00000000-0000-4000-8000-000000000001",
} as const;

/**
 * Demo login (client/client) is a local/dev convenience only.
 * Disabled by default. Never available when NODE_ENV or VERCEL_ENV is production,
 * even if ENABLE_DEMO_LOGIN is set.
 */
function isDemoLoginEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  if (process.env.VERCEL_ENV === "production") {
    return false;
  }
  return process.env.ENABLE_DEMO_LOGIN === "true";
}

function returnToFromReferer(request: NextRequest): string | null {
  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).searchParams.get("return_to");
  } catch {
    return null;
  }
}

function nextFromReferer(request: NextRequest): string | null {
  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).searchParams.get("next");
  } catch {
    return null;
  }
}

function wantsAbhiPortalsNext(nextRaw: string | null | undefined): boolean {
  const nextPath = parseSafePostLoginNext(nextRaw);
  const rawNext = String(nextRaw ?? "").trim();
  return (
    nextPath === "/portals" ||
    nextPath?.startsWith("/portals/") === true ||
    rawNext === "/portals" ||
    rawNext.startsWith("/portals?")
  );
}

function applyPortalsGateIfNeeded(
  response: NextResponse,
  request: NextRequest,
  options: { nextRaw: string | null; username?: string | null; userType: string },
) {
  if (
    wantsAbhiPortalsNext(options.nextRaw) &&
    isAbhiPortalsAllowedUsername(options.username) &&
    options.userType !== "external"
  ) {
    applyAbhiPortalsGateCookie(response, request);
  }
}

/**
 * Resolve post-login navigation.
 * Priority for Talanton company-portal externals: assigned portal URL (never admin dashboard).
 * Otherwise: workspace return_to → demo/internal return_to (+ optional next) →
 * deep-link next → stored redirect_path (canonicalized).
 */
async function resolvePostLoginRedirect(options: {
  redirectPath: string;
  requestHost: string | null;
  returnToRaw: string | null;
  nextRaw: string | null;
  userType: string;
  username?: string | null;
}): Promise<string> {
  const { redirectPath, requestHost, returnToRaw, nextRaw, userType, username } = options;
  const loginReturn = parseLoginReturnTo(returnToRaw);
  const nextPath = parseSafePostLoginNext(nextRaw);
  const wantsPortalsNext = wantsAbhiPortalsNext(nextRaw);

  // Prefer /portals whenever the deep-link asked for it (ABHI demo/admin only).
  // Do this before the generic workspace → dashboard default.
  if (wantsPortalsNext && isAbhiPortalsAllowedUsername(username) && userType !== "external") {
    const fromReturn =
      loginReturn?.kind === "workspace"
        ? loginReturn.origin
        : parseValidWorkspaceReturnTo(returnToRaw);
    const hostSlug = parseClientPlatformSubdomainSafe(requestHost);
    const origin =
      (fromReturn && isAbhiSlug(parseClientPlatformSubdomainSafe(new URL(fromReturn).host))
        ? fromReturn
        : null) ||
      (isAbhiSlug(hostSlug) ? customerWorkspaceOrigin(hostSlug!) : null);
    if (origin) {
      return `${origin.replace(/\/$/, "")}/portals`;
    }
  }

  // Demo / Internal hosts must keep the user on that host after login.
  // Never bounce a Demo login onto internal.unit311central.com.
  if (userType !== "external" && isDemoDomainHost(requestHost)) {
    const path = nextPath && nextPath !== "/" ? nextPath : "/";
    return path === "/" ? `${DEMO_SITE_URL}/` : `${DEMO_SITE_URL}${path}`;
  }
  if (userType !== "external" && isInternalDomainHost(requestHost)) {
    const path = nextPath && nextPath !== "/" ? nextPath : "/";
    return path === "/" ? `${INTERNAL_SITE_URL}/` : `${INTERNAL_SITE_URL}${path}`;
  }

  // Company/member portal externals must never land in the admin shell.
  if (userType === "external") {
    const talantonPortalUrl = resolveTalantonCompanyPortalPostLoginUrl({
      redirectPath,
      nextRaw: nextPath ?? nextRaw,
      returnToRaw,
      requestHost,
    });
    if (talantonPortalUrl) return talantonPortalUrl;

    const abhiPortalUrl = resolveAbhiMemberPortalPostLoginUrl({
      redirectPath,
      nextRaw: nextPath ?? nextRaw,
      returnToRaw,
      requestHost,
    });
    if (abhiPortalUrl) return abhiPortalUrl;
  }

  if (loginReturn?.kind === "workspace") {
    const slug = parseClientPlatformSubdomainSafe(new URL(loginReturn.origin).host);
    // Only land on /portals when that was the explicit deep-link (e.g. login?next=/portals).
    if (
      wantsPortalsNext &&
      isAbhiSlug(slug) &&
      isAbhiPortalsAllowedUsername(username) &&
      userType !== "external"
    ) {
      return `${loginReturn.origin.replace(/\/$/, "")}/portals`;
    }
    let needsOnboarding = false;
    if (slug) {
      try {
        needsOnboarding = await workspaceNeedsCustomerOnboarding(slug);
      } catch {
        needsOnboarding = false;
      }
    }
    return workspacePostLoginUrl(loginReturn.origin, needsOnboarding ? "onboarding" : "dashboard");
  }

  if (loginReturn?.kind === "demo" || loginReturn?.kind === "internal") {
    const path = nextPath || "/";
    if (path === "/" || path === "") {
      return `${loginReturn.origin.replace(/\/$/, "")}/`;
    }
    return resolveBrowserRedirectPathForHost(path, requestHost, {
      userType: "internal",
      opsOrigin: loginReturn.origin,
    });
  }

  // Workspace-only helper still used by older clients that only send validated workspace URLs.
  const workspaceOnly = parseValidWorkspaceReturnTo(returnToRaw);
  if (workspaceOnly) {
    const slug = parseClientPlatformSubdomainSafe(new URL(workspaceOnly).host);
    if (
      wantsPortalsNext &&
      isAbhiSlug(slug) &&
      isAbhiPortalsAllowedUsername(username) &&
      userType !== "external"
    ) {
      return `${workspaceOnly.replace(/\/$/, "")}/portals`;
    }
    let needsOnboarding = false;
    if (slug) {
      try {
        needsOnboarding = await workspaceNeedsCustomerOnboarding(slug);
      } catch {
        needsOnboarding = false;
      }
    }
    return workspacePostLoginUrl(workspaceOnly, needsOnboarding ? "onboarding" : "dashboard");
  }

  if (nextPath) {
    return resolveBrowserRedirectPathForHost(nextPath, requestHost, {
      userType: userType === "external" ? "external" : "internal",
    });
  }

  return resolveBrowserRedirectPathForHost(redirectPath, requestHost, {
    userType,
  });
}

async function createDemoLoginResponse(
  request: NextRequest,
  returnToRaw: string | null,
  nextRaw: string | null,
) {
  const loginReturn = parseLoginReturnTo(returnToRaw);
  const workspaceSlug =
    loginReturn?.kind === "workspace"
      ? parseClientPlatformSubdomainSafe(new URL(loginReturn.origin).host)
      : null;
  const workspace = await resolveWorkspaceBinding({
    workspaceSlug,
    fallbackInternal: !workspaceSlug,
  });

  const session: PlatformSession = withSessionWorkspace(
    {
      sub: DEMO_LOGIN.userId,
      username: DEMO_LOGIN.username,
      displayName: "Client",
      userType: "internal",
      redirectPath: "/",
      exp: Date.now() + PLATFORM_SESSION_MAX_AGE_SECONDS * 1000,
    },
    workspace,
  );

  const redirectPath = await resolvePostLoginRedirect({
    redirectPath: DEMO_LOGIN.redirectPath,
    requestHost: getRequestHost(request),
    returnToRaw,
    nextRaw,
    userType: "internal",
  });

  const response = NextResponse.json({
    redirectPath,
    userType: session.userType,
    displayName: session.displayName,
    workspace: workspace
      ? { id: workspace.id, slug: workspace.slug, name: workspace.name }
      : null,
  });

  applyPlatformSessionCookie(response, await createPlatformSessionToken(session), request);

  return response;
}

async function createAbhiPortalsCredentialLoginResponse(
  request: NextRequest,
  usernameRaw: string,
  returnToRaw: string | null,
  nextRaw: string | null,
  workspaceSlug: string | null,
) {
  const username = normalizePlatformUsername(usernameRaw);
  if (!isAbhiSlug(workspaceSlug) || !isAbhiPortalsAllowedUsername(username)) {
    return null;
  }

  const workspace = await resolveWorkspaceBinding({
    workspaceSlug,
    fallbackInternal: false,
  });

  const displayName = username === ABHI_PORTALS_ADMIN_USERNAME ? "ABHI Portals Admin" : "ABHI Demo";
  const session: PlatformSession = withSessionWorkspace(
    {
      sub:
        username === ABHI_PORTALS_ADMIN_USERNAME
          ? "00000000-0000-4000-8000-00000000ab01"
          : "00000000-0000-4000-8000-00000000ab02",
      username,
      displayName,
      userType: "internal",
      redirectPath: "/dashboard",
      exp: Date.now() + PLATFORM_SESSION_MAX_AGE_SECONDS * 1000,
    },
    workspace,
  );

  const redirectPath = await resolvePostLoginRedirect({
    redirectPath: "/dashboard",
    requestHost: getRequestHost(request),
    returnToRaw,
    nextRaw,
    userType: "internal",
    username,
  });

  const response = NextResponse.json({
    redirectPath,
    userType: session.userType,
    displayName: session.displayName,
    workspace: workspace
      ? { id: workspace.id, slug: workspace.slug, name: workspace.name }
      : null,
  });

  applyPlatformSessionCookie(response, await createPlatformSessionToken(session), request);
  applyPortalsGateIfNeeded(response, request, {
    nextRaw,
    username,
    userType: "internal",
  });
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
      returnTo?: string;
      next?: string;
    };

    if (!body.username?.trim() || !body.password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    const requestHost = getRequestHost(request);
    const hostWorkspaceSlug = parseClientPlatformSubdomainSafe(requestHost);
    const hostWorkspaceOrigin = hostWorkspaceSlug
      ? customerWorkspaceOrigin(hostWorkspaceSlug)
      : isDemoDomainHost(requestHost)
        ? DEMO_SITE_URL
        : isInternalDomainHost(requestHost)
          ? INTERNAL_SITE_URL
          : null;

    const returnToRaw =
      body.returnTo?.trim() ||
      returnToFromReferer(request) ||
      hostWorkspaceOrigin;
    const nextRaw = body.next?.trim() || null;

    const loginReturn = parseLoginReturnTo(returnToRaw);
    const workspaceSlug =
      loginReturn?.kind === "demo"
        ? DEMO_WORKSPACE_SLUG
        : loginReturn?.kind === "internal"
          ? INTERNAL_WORKSPACE_SLUG
          : loginReturn?.kind === "workspace"
            ? parseClientPlatformSubdomainSafe(new URL(loginReturn.origin).host)
            : isDemoDomainHost(requestHost)
              ? DEMO_WORKSPACE_SLUG
              : isInternalDomainHost(requestHost)
                ? INTERNAL_WORKSPACE_SLUG
                : hostWorkspaceSlug ??
                  parseClientPlatformSubdomainSafe(
                    parseValidWorkspaceReturnTo(returnToRaw)
                      ? new URL(parseValidWorkspaceReturnTo(returnToRaw)!).host
                      : null,
                  );

    if (
      isDemoLoginEnabled() &&
      normalizePlatformUsername(body.username) === DEMO_LOGIN.username &&
      body.password === DEMO_LOGIN.password
    ) {
      return createDemoLoginResponse(request, returnToRaw, nextRaw);
    }

    // Prefer real workspace membership first so /login lands on the main platform.
    // Fall back to the shared demo password login only when DB auth fails.
    if (isSupabaseConfigured()) {
      const result = await loginPlatformUser(body.username, body.password, {
        workspaceSlug,
      });
      if (result && !("forbidden" in result)) {
        if (
          isAbhiSlug(workspaceSlug) &&
          result.session.userType !== "external" &&
          !isAbhiPortalsAllowedUsername(result.session.username)
        ) {
          return NextResponse.json(
            {
              error: `ABHI platform login is limited to ${ABHI_DEMO_PLATFORM_USERNAME} and ${ABHI_PORTALS_ADMIN_USERNAME} for this demonstration.`,
            },
            { status: 403 },
          );
        }

        try {
          await recordPlatformUserLogin(result.session.sub);
        } catch {
          // Non-blocking if last_login_at column is not yet migrated.
        }

        const redirectPath = await resolvePostLoginRedirect({
          redirectPath: result.redirectPath,
          requestHost: getRequestHost(request),
          returnToRaw,
          nextRaw,
          userType: result.session.userType,
          username: result.session.username,
        });

        const response = NextResponse.json({
          redirectPath,
          appliedReturnTo: loginReturn?.origin ?? parseValidWorkspaceReturnTo(returnToRaw),
          userType: result.session.userType,
          displayName: result.session.displayName,
          workspace: result.session.workspaceId
            ? {
                id: result.session.workspaceId,
                slug: result.session.workspaceSlug,
                name: result.session.workspaceName,
              }
            : null,
        });

        applyPlatformSessionCookie(response, result.token, request);
        applyPortalsGateIfNeeded(response, request, {
          nextRaw,
          username: result.session.username,
          userType: result.session.userType,
        });
        return response;
      }

      if (result && "forbidden" in result) {
        return NextResponse.json(
          { error: "You do not have access to this workspace." },
          { status: 403 },
        );
      }
    }

    if (body.password === ABHI_PORTALS_SHARED_PASSWORD) {
      const portalsLogin = await createAbhiPortalsCredentialLoginResponse(
        request,
        body.username,
        returnToRaw,
        nextRaw,
        workspaceSlug,
      );
      if (portalsLogin) return portalsLogin;
    }

    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
