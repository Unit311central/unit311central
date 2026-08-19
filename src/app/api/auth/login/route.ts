import { NextRequest, NextResponse } from "next/server";

import {
  PLATFORM_SESSION_MAX_AGE_SECONDS,
  createPlatformSessionToken,
  normalizePlatformUsername,
  type PlatformSession,
} from "@/lib/platform-auth";
import { applyPlatformSessionCookie, applyOverviewEntryGateCookie } from "@/lib/platform-session-cookie";
import { applyPortalsBriefingGateCookie } from "@/lib/portals/briefing/cookies";
import {
  resolveAnyPortalPostLoginUrl,
  resolveAnyPortalSessionRedirect,
  resolvePortalSessionRedirect,
} from "@/lib/portals/post-login";
import {
  getPortalPackBySlug,
  isPortalsBriefingAllowedUsername,
  listPortalWorkspacePacks,
} from "@/lib/portals/registry";
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
import { matchOnwardAirClientPortalPathname } from "@/lib/onwardair/client-portal-routes";
import {
  ABHI_DEMO_PLATFORM_USERNAME,
  ABHI_PORTALS_ADMIN_USERNAME,
  ABHI_PORTALS_SHARED_PASSWORD,
  isAbhiPortalsAllowedUsername,
} from "@/lib/abhi/portals-auth";
import {
  ONWARDAIR_DEMO_PLATFORM_USERNAME,
  ONWARDAIR_PORTALS_ADMIN_USERNAME,
  ONWARDAIR_PORTALS_SHARED_PASSWORD,
  isOnwardAirPortalsAllowedUsername,
} from "@/lib/onwardair/portals-demo";
import {
  TALANTON_DEMO_PLATFORM_USERNAME,
  TALANTON_PORTALS_ADMIN_USERNAME,
  TALANTON_PORTALS_SHARED_PASSWORD,
  isTalantonPortalsAllowedUsername,
} from "@/lib/talanton/portals-demo";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { isOnwardAirSlug, ONWARDAIR_SLUG } from "@/lib/onwardair-surface";
import {
  canonicalizeTalantonImpactSlug,
  isTalantonImpactSlug,
  TALANTON_IMPACT_SLUG,
} from "@/lib/talanton-surface";
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
  redirectPath: "/dashboard",
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
  options: { nextRaw: string | null; username?: string | null; userType: string; workspaceSlug?: string | null },
) {
  if (options.userType === "external") return;
  if (!wantsAbhiPortalsNext(options.nextRaw)) return;

  const slug = options.workspaceSlug;
  if (slug && isPortalsBriefingAllowedUsername(options.username, slug)) {
    applyPortalsBriefingGateCookie(response, request);
    return;
  }

  for (const pack of listPortalWorkspacePacks()) {
    if (pack.briefing?.isAllowedUsername(options.username)) {
      applyPortalsBriefingGateCookie(response, request);
      break;
    }
  }
}

function wantsOverviewPortalNext(nextRaw: string | null | undefined): boolean {
  const nextPath = parseSafePostLoginNext(nextRaw);
  const match = matchOnwardAirClientPortalPathname(nextPath ?? "");
  return match?.route.portalKind === "overview";
}

function applyOverviewEntryGateIfNeeded(
  response: NextResponse,
  request: NextRequest,
  options: {
    nextRaw: string | null;
    redirectPath: string;
    userType: string;
    username?: string | null;
  },
) {
  if (options.userType !== "external") return;

  const overviewRoute = resolvePortalSessionRedirect({
    workspaceSlug: ONWARDAIR_SLUG,
    redirectPath: options.redirectPath,
    nextRaw: options.nextRaw,
    username: options.username,
  });
  const isOverviewLogin =
    overviewRoute === "/overview" ||
    wantsOverviewPortalNext(options.nextRaw) ||
    options.redirectPath === "/overview";

  if (isOverviewLogin) {
    applyOverviewEntryGateCookie(response, request);
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
  const hostSlug = parseClientPlatformSubdomainSafe(requestHost);
  const portalsAllowed = hostSlug
    ? isPortalsBriefingAllowedUsername(username, hostSlug)
    : isDemoDomainHost(requestHost)
      ? isPortalsBriefingAllowedUsername(username, DEMO_WORKSPACE_SLUG)
      : listPortalWorkspacePacks().some((pack) => pack.briefing?.isAllowedUsername(username));

  // Prefer /portals whenever the deep-link asked for it (demo/admin only).
  // Do this before the generic workspace → dashboard default.
  if (wantsPortalsNext && portalsAllowed && userType !== "external") {
    const fromReturn =
      loginReturn?.kind === "workspace"
        ? loginReturn.origin
        : parseValidWorkspaceReturnTo(returnToRaw);
    const fromReturnSlug = fromReturn
      ? parseClientPlatformSubdomainSafe(new URL(fromReturn).host)
      : null;
    const origin =
      (fromReturn &&
      (isAbhiSlug(fromReturnSlug) ||
        isTalantonImpactSlug(fromReturnSlug) ||
        isOnwardAirSlug(fromReturnSlug))
        ? fromReturn
        : null) ||
      (isAbhiSlug(hostSlug)
        ? customerWorkspaceOrigin(hostSlug!)
        : isTalantonImpactSlug(hostSlug)
          ? customerWorkspaceOrigin(hostSlug!)
          : isOnwardAirSlug(hostSlug)
            ? customerWorkspaceOrigin(hostSlug!)
            : isDemoDomainHost(requestHost)
              ? DEMO_SITE_URL
              : null);
    if (origin) {
      return `${origin.replace(/\/$/, "")}/portals`;
    }
  }

  // Demo / Internal hosts must keep the user on that host after login.
  // Never bounce a Demo login onto internal.unit311central.com.
  // Demo apex `/` always clears the session and forces /login, so land on /dashboard.
  if (userType !== "external" && isDemoDomainHost(requestHost)) {
    const path = nextPath && nextPath !== "/" ? nextPath : "/dashboard";
    return `${DEMO_SITE_URL}${path}`;
  }
  if (userType !== "external" && isInternalDomainHost(requestHost)) {
    const path = nextPath && nextPath !== "/" ? nextPath : "/";
    return path === "/" ? `${INTERNAL_SITE_URL}/` : `${INTERNAL_SITE_URL}${path}`;
  }

  // Company/member portal externals must never land in the admin shell.
  if (userType === "external") {
    const portalUrl = resolveAnyPortalPostLoginUrl({
      redirectPath,
      nextRaw: nextPath ?? nextRaw,
      returnToRaw,
      requestHost,
      username,
    });
    if (portalUrl) return portalUrl;
  }

  if (loginReturn?.kind === "workspace") {
    const slug = parseClientPlatformSubdomainSafe(new URL(loginReturn.origin).host);
    // Only land on /portals when that was the explicit deep-link (e.g. login?next=/portals).
    if (
      wantsPortalsNext &&
      (isAbhiSlug(slug) || isTalantonImpactSlug(slug)) &&
      portalsAllowed &&
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
      (isAbhiSlug(slug) || isTalantonImpactSlug(slug)) &&
      portalsAllowed &&
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

async function createTalantonPortalsCredentialLoginResponse(
  request: NextRequest,
  usernameRaw: string,
  returnToRaw: string | null,
  nextRaw: string | null,
  workspaceSlug: string | null,
) {
  const username = normalizePlatformUsername(usernameRaw);
  if (!isTalantonImpactSlug(workspaceSlug) || !isTalantonPortalsAllowedUsername(username)) {
    return null;
  }

  const workspace = await resolveWorkspaceBinding({
    workspaceSlug: canonicalizeTalantonImpactSlug(workspaceSlug) ?? TALANTON_IMPACT_SLUG,
    fallbackInternal: false,
  });

  const displayName =
    username === TALANTON_PORTALS_ADMIN_USERNAME
      ? "Talanton Portals Admin"
      : "Talanton Demo";
  const session: PlatformSession = withSessionWorkspace(
    {
      sub:
        username === TALANTON_PORTALS_ADMIN_USERNAME
          ? "00000000-0000-4000-8000-00000000ti01"
          : "00000000-0000-4000-8000-00000000ti02",
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

async function createOnwardAirPortalsCredentialLoginResponse(
  request: NextRequest,
  usernameRaw: string,
  returnToRaw: string | null,
  nextRaw: string | null,
  workspaceSlug: string | null,
) {
  const username = normalizePlatformUsername(usernameRaw);
  if (!isOnwardAirSlug(workspaceSlug) || !isOnwardAirPortalsAllowedUsername(username)) {
    return null;
  }

  const workspace = await resolveWorkspaceBinding({
    workspaceSlug,
    fallbackInternal: false,
  });

  const displayName =
    username === ONWARDAIR_PORTALS_ADMIN_USERNAME
      ? "OnwardAir Portals Admin"
      : "OnwardAir Demo";
  const session: PlatformSession = withSessionWorkspace(
    {
      sub:
        username === ONWARDAIR_PORTALS_ADMIN_USERNAME
          ? "00000000-0000-4000-8000-00000000oa01"
          : "00000000-0000-4000-8000-00000000oa02",
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
    const nextRaw = body.next?.trim() || nextFromReferer(request) || null;

    const loginReturn = parseLoginReturnTo(returnToRaw);
    const resolvedWorkspaceSlug =
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
    // Alias host talanton.* binds to the canonical talantonimpact workspace.
    const workspaceSlug =
      canonicalizeTalantonImpactSlug(resolvedWorkspaceSlug) ?? resolvedWorkspaceSlug;

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

        if (
          isTalantonImpactSlug(workspaceSlug) &&
          result.session.userType !== "external" &&
          wantsAbhiPortalsNext(nextRaw) &&
          !isTalantonPortalsAllowedUsername(result.session.username)
        ) {
          return NextResponse.json(
            {
              error: `Talanton portals login is limited to ${TALANTON_DEMO_PLATFORM_USERNAME} and ${TALANTON_PORTALS_ADMIN_USERNAME}.`,
            },
            { status: 403 },
          );
        }

        if (
          isOnwardAirSlug(workspaceSlug) &&
          result.session.userType !== "external" &&
          wantsAbhiPortalsNext(nextRaw) &&
          !isOnwardAirPortalsAllowedUsername(result.session.username)
        ) {
          return NextResponse.json(
            {
              error: `OnwardAir portals login is limited to ${ONWARDAIR_DEMO_PLATFORM_USERNAME} and ${ONWARDAIR_PORTALS_ADMIN_USERNAME}.`,
            },
            { status: 403 },
          );
        }

        try {
          await recordPlatformUserLogin(result.session.sub);
        } catch {
          // Non-blocking if last_login_at column is not yet migrated.
        }

        // Member-portal logins must carry the portal path in the session JWT —
        // middleware rejects /dashboard (and other non-portal) redirectPaths.
        let session = result.session;
        let token = result.token;
        let storedRedirect = result.redirectPath;
        if (session.userType === "external") {
          const portalRedirect = resolveAnyPortalSessionRedirect({
            redirectPath: session.redirectPath || result.redirectPath,
            nextRaw,
            username: session.username,
          });
          if (portalRedirect && portalRedirect !== session.redirectPath) {
            session = { ...session, redirectPath: portalRedirect };
            token = await createPlatformSessionToken(session);
            storedRedirect = portalRedirect;
          }
        }

        const redirectPath = await resolvePostLoginRedirect({
          redirectPath: storedRedirect,
          requestHost: getRequestHost(request),
          returnToRaw,
          nextRaw,
          userType: session.userType,
          username: session.username,
        });

        const response = NextResponse.json({
          redirectPath,
          appliedReturnTo: loginReturn?.origin ?? parseValidWorkspaceReturnTo(returnToRaw),
          userType: session.userType,
          displayName: session.displayName,
          workspace: session.workspaceId
            ? {
                id: session.workspaceId,
                slug: session.workspaceSlug,
                name: session.workspaceName,
              }
            : null,
        });

        applyPlatformSessionCookie(response, token, request);
        applyPortalsGateIfNeeded(response, request, {
          nextRaw,
          username: result.session.username,
          userType: result.session.userType,
          workspaceSlug,
        });
        applyOverviewEntryGateIfNeeded(response, request, {
          nextRaw,
          redirectPath: session.redirectPath,
          username: session.username,
          userType: session.userType,
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

    if (body.password === TALANTON_PORTALS_SHARED_PASSWORD) {
      const portalsLogin = await createTalantonPortalsCredentialLoginResponse(
        request,
        body.username,
        returnToRaw,
        nextRaw,
        workspaceSlug,
      );
      if (portalsLogin) return portalsLogin;
    }

    if (body.password === ONWARDAIR_PORTALS_SHARED_PASSWORD) {
      const portalsLogin = await createOnwardAirPortalsCredentialLoginResponse(
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
