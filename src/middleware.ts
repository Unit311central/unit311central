import { NextRequest, NextResponse } from "next/server";

import {
  CENTRAL_SITE_URL,
  DEMO_SITE_URL,
  DEMO_WORKSPACE_SLUG,
  INTERNAL_SITE_URL,
  UNIT311_SITE_HOST,
  WORKSPACE_HOST_ROUTE_PREFIX,
  buildInternalHostRedirectUrl,
  getRequestHost,
  isDemoDomainHost,
  isInternalDomainHost,
  isLocalDevHost,
  isPublicMarketingPath,
  isPublicSiteHost,
  legacyViewRedirects,
  mapHardPathToViewQuery,
  mapLegacyInternalPathToInternalHostPath,
  normalizeHost,
  parseClientPlatformSubdomainSafe,
} from "@/lib/app-domains";
import {
  applyCustomerHostRebindIfNeeded,
  customerHostLoginRedirect,
  evaluateCustomerHostSessionGate,
} from "@/lib/workspace-host-session-gate";
import { matchTalantonCompanyPortalPathname } from "@/lib/talanton/company-portal-routes";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { matchAbhiMemberPortalPathname } from "@/lib/abhi/member-portal-routes";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { matchOnwardAirClientPortalPathname, getOnwardAirClientPortalByPath } from "@/lib/onwardair/client-portal-routes";
import { isOverviewPortalAccessAllowed, isFreshOverviewDocumentNavigation, isOverviewAuthBypassEnabled } from "@/lib/onwardair/overview-gate";
import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import { isAbhiPortalsAllowedUsername } from "@/lib/abhi/portals-demo";
import { isOnwardAirPortalsAllowedUsername } from "@/lib/onwardair/portals-demo";
import { isTalantonPortalsAllowedUsername } from "@/lib/talanton/portals-auth";
import {
  ABHI_PORTALS_GATE_COOKIE,
  ABHI_PORTALS_VIEW_COOKIE,
  applyAbhiPortalsViewCookie,
  applyOverviewViewCookie,
  clearAbhiPortalsGateCookie,
  clearOverviewGateCookie,
  clearPlatformSessionCookie,
} from "@/lib/platform-session-cookie";
import {
  PLATFORM_SESSION_COOKIE,
  readPlatformSessionToken,
} from "@/lib/platform-session-token";

function canonicalizePortalRedirect(redirectPath: string | null | undefined): string | null {
  if (!redirectPath) return null;
  const talanton = matchTalantonCompanyPortalPathname(redirectPath);
  if (talanton) return `/${talanton.route.path}`;
  const abhi = matchAbhiMemberPortalPathname(redirectPath);
  if (abhi) return `/${abhi.route.path}`;
  const onwardair = matchOnwardAirClientPortalPathname(redirectPath);
  if (onwardair) return `/${onwardair.route.path}`;
  return null;
}

/** Route-based company/member portal slugs — talantonimpact, abhi, onwardair. */
function isCompanyPortalSlug(workspaceSlug: string): boolean {
  return (
    isTalantonImpactSlug(workspaceSlug) ||
    workspaceSlug === ABHI_SLUG ||
    isOnwardAirSlug(workspaceSlug)
  );
}

function isPortalsAllowedUsername(username: string | null | undefined, workspaceSlug: string): boolean {
  if (workspaceSlug === ABHI_SLUG) return isAbhiPortalsAllowedUsername(username);
  if (isTalantonImpactSlug(workspaceSlug)) return isTalantonPortalsAllowedUsername(username);
  if (isOnwardAirSlug(workspaceSlug)) return isOnwardAirPortalsAllowedUsername(username);
  return false;
}

/** Next.js / browser prefetch must not clear auth gates or bounce live sessions. */
function isNextPrefetchRequest(request: NextRequest): boolean {
  const purpose = request.headers.get("Purpose") ?? request.headers.get("Sec-Purpose");
  return (
    request.headers.get("Next-Router-Prefetch") === "1" ||
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("X-Middleware-Prefetch") === "1" ||
    purpose === "prefetch"
  );
}

function matchPortalPathnameForSlug(workspaceSlug: string, pathname: string) {
  if (isTalantonImpactSlug(workspaceSlug)) return matchTalantonCompanyPortalPathname(pathname);
  if (workspaceSlug === ABHI_SLUG) return matchAbhiMemberPortalPathname(pathname);
  if (isOnwardAirSlug(workspaceSlug)) return matchOnwardAirClientPortalPathname(pathname);
  return null;
}

/** Hidden App Router implementation base for a portal slug — never a public browser URL. */
function portalImplBaseForSlug(workspaceSlug: string): string | null {
  if (isTalantonImpactSlug(workspaceSlug)) return "/portfolio-portal";
  if (workspaceSlug === ABHI_SLUG) return "/member-portal";
  if (isOnwardAirSlug(workspaceSlug)) return "/client-portal";
  return null;
}

function withHostHeaders(
  request: NextRequest,
  flags: { public?: boolean; internal?: boolean; demo?: boolean; workspaceSlug?: string },
) {
  const requestHeaders = new Headers(request.headers);
  if (flags.public) requestHeaders.set("x-unit311-central", "1");
  if (flags.internal) requestHeaders.set("x-unit311-internal", "1");
  if (flags.demo) {
    requestHeaders.set("x-unit311-demo", "1");
    requestHeaders.set("x-unit311-internal", "1");
    requestHeaders.set("x-unit311-workspace-slug", DEMO_WORKSPACE_SLUG);
  }
  if (flags.workspaceSlug) {
    requestHeaders.set("x-unit311-workspace-slug", flags.workspaceSlug);
  }
  return requestHeaders;
}

function redirectExternal(url: string, status: 307 | 308 = 307) {
  const response = NextResponse.redirect(url, status);
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, max-age=0, must-revalidate",
  );
  return response;
}

/** Permanent redirect for deprecated browser URLs (bookmarks / old links). */
function redirectPermanent(request: NextRequest, pathnameWithSearch: string) {
  const destination = request.nextUrl.clone();
  const parsed = new URL(pathnameWithSearch, request.nextUrl.origin);
  destination.pathname = parsed.pathname;
  destination.search = parsed.search;
  destination.hash = parsed.hash;
  return NextResponse.redirect(destination, 308);
}

function isLegacyInternalBrowserPath(pathname: string) {
  return (
    pathname === "/internaldashboard" ||
    pathname.startsWith("/internaldashboard/") ||
    pathname === "/testflighthub" ||
    pathname.startsWith("/testflighthub/")
  );
}

/**
 * If the browser still requests the legacy App Router path, send them to the
 * canonical internal-host URL. Middleware continues to *rewrite* `/` onto
 * `/internaldashboard` as the implementation path — that is not a public URL.
 */
function redirectLegacyInternalBrowserPath(request: NextRequest, pathname: string, search: string) {
  if (!isLegacyInternalBrowserPath(pathname)) return null;
  const mapped = mapLegacyInternalPathToInternalHostPath(pathname, search);
  return redirectPermanent(request, mapped);
}

function rewriteTo(
  request: NextRequest,
  pathname: string,
  headers: Headers,
  responseHeaders?: Record<string, string>,
) {
  const destination = request.nextUrl.clone();
  destination.pathname = pathname;
  const response = NextResponse.rewrite(destination, { request: { headers } });
  response.headers.set("Cache-Control", "private, no-cache, no-store, max-age=0, must-revalidate");
  if (responseHeaders) {
    for (const [key, value] of Object.entries(responseHeaders)) {
      response.headers.set(key, value);
    }
  }
  return response;
}

/**
 * Apex (public site): marketing + permanent redirects of legacy internal paths.
 * Internal host: rewrite `/` onto /internaldashboard (App Router); never
 * expose /internaldashboard as a public browser URL.
 * Demo host: apex `/` always forces /login (no auto session); shell is /dashboard.
 * Customer hosts `{slug}.unit311central.com`: rewrite onto /ws/[slug] gateway.
 *
 * RC1-C07: on customer hosts, host is the tenant boundary. Valid sessions that
 * are authorised for the host workspace are rebound automatically; invalid or
 * unauthorised sessions are sent to login.
 */
export async function middleware(request: NextRequest) {
  const host = getRequestHost(request);
  const { pathname, search } = request.nextUrl;
  const normalizedHost = normalizeHost(host);

  // Internal workspace slug must never be a customer subdomain host.
  if (normalizedHost === `unit311.${UNIT311_SITE_HOST}`) {
    return redirectExternal(`${INTERNAL_SITE_URL}${pathname === "/" ? "" : pathname}${search}`);
  }

  // --- Customer workspace hosts: route into the app (existence checked in /ws/[slug]) ---
  const workspaceSlug = parseClientPlatformSubdomainSafe(host);
  if (workspaceSlug) {
    // Canonical CorpCentre host is corpcentre.*; keep old corporatecentre.* working.
    if (workspaceSlug === "corporatecentre") {
      return redirectExternal(
        `https://corpcentre.${UNIT311_SITE_HOST}${pathname === "/" ? "" : pathname}${search}`,
      );
    }

    // Canonical OnwardAir host is onwardair.*; keep short onward.* bookmarks branded correctly.
    if (workspaceSlug === "onward") {
      return redirectExternal(
        `https://onwardair.${UNIT311_SITE_HOST}${pathname === "/" ? "" : pathname}${search}`,
      );
    }

    const headers = withHostHeaders(request, { workspaceSlug });
    const workspaceOrigin = `https://${workspaceSlug}.${UNIT311_SITE_HOST}`;
    const workspaceResponseHeaders = {
      "x-unit311-workspace": "1",
      "x-unit311-workspace-slug": workspaceSlug,
    };

    // OnwardAir: never expose /client-portal/* implementation URLs on the customer host.
    if (
      isOnwardAirSlug(workspaceSlug) &&
      (pathname === "/client-portal" || pathname.startsWith("/client-portal/"))
    ) {
      const parts = pathname.split("/").filter(Boolean);
      const route = getOnwardAirClientPortalByPath(parts[1] ?? "");
      if (route) {
        const rest = parts.length > 2 ? `/${parts.slice(2).join("/")}` : "";
        return redirectExternal(`${workspaceOrigin}/${route.path}${rest}${search}`);
      }
      return redirectExternal(`${workspaceOrigin}/login${search}`);
    }

    // Route-based company/member portals: /{company}/... on talantonimpact and abhi hosts only.
    // These URLs must NEVER fall through to the admin /internaldashboard shell.
    if (isCompanyPortalSlug(workspaceSlug)) {
      const portalMatch = matchPortalPathnameForSlug(workspaceSlug, pathname);
      const portalImplBase = portalImplBaseForSlug(workspaceSlug);
      if (portalMatch && portalImplBase) {
        const gate = await evaluateCustomerHostSessionGate(request, workspaceSlug);
        const isLoginRest =
          portalMatch.rest === "/login" || portalMatch.rest.startsWith("/login/");

        const portalLoginPublicUrl = `${workspaceOrigin}/${portalMatch.route.path}/login${search}`;
        const isOverviewPortal = portalMatch.route.portalKind === "overview";

        const companyPortalLoginRewrite = () =>
          rewriteTo(
            request,
            `${portalImplBase}/${portalMatch.route.path}/login`,
            headers,
            {
              ...workspaceResponseHeaders,
              "x-unit311-company-portal": portalMatch.route.path,
            },
          );

        // Send unauthenticated visitors to /{company}/login in the address bar.
        // Rewriting /{company} → login while keeping the URL caused the client
        // router to hydrate the authenticated portal route at /{company}.
        const companyPortalLoginGate = (clearSession = false) => {
          if (!isLoginRest) {
            const response = redirectExternal(portalLoginPublicUrl);
            if (clearSession || isOverviewPortal) clearPlatformSessionCookie(response, request);
            if (isOverviewPortal) clearOverviewGateCookie(response, request);
            return response;
          }
          const response = companyPortalLoginRewrite();
          if (clearSession) clearPlatformSessionCookie(response, request);
          if (
            isOverviewPortal &&
            isFreshOverviewDocumentNavigation(request) &&
            !isNextPrefetchRequest(request)
          ) {
            clearOverviewGateCookie(response, request);
          }
          return response;
        };

        // TEMP: public overview preview (Screenfly / responsive QA) — no login required.
        if (isOverviewPortal && isOverviewAuthBypassEnabled()) {
          if (isLoginRest) {
            return redirectExternal(`${workspaceOrigin}/${portalMatch.route.path}${search}`);
          }
          const internalPath = `${portalImplBase}/${portalMatch.route.path}${portalMatch.rest}`;
          return rewriteTo(request, internalPath, headers, {
            ...workspaceResponseHeaders,
            "x-unit311-company-portal": portalMatch.route.path,
          });
        }

        // Anonymous: branded portal login at /{company}/login.
        if (gate.status === "anonymous") {
          return companyPortalLoginGate();
        }

        // Invalid / forbidden / missing workspace: MUST clear the shared
        // Domain=.unit311central.com cookie. Otherwise login page / auth helpers
        // keep seeing a readable JWT and redirect back to /{company} forever
        // (ERR_TOO_MANY_REDIRECTS).
        if (
          gate.status === "invalid" ||
          gate.status === "forbidden" ||
          gate.status === "workspace_missing"
        ) {
          return companyPortalLoginGate(true);
        }

        // Member portals are external-only. Internal ABHI/Talanton staff sessions
        // must still see the branded login (not skip straight into the portal view).
        if (gate.session.userType !== "external") {
          return companyPortalLoginGate();
        }

        const allowed = canonicalizePortalRedirect(gate.session.redirectPath);
        if (!allowed) {
          // Member with no company portal assignment — do not enter portal app.
          return companyPortalLoginGate(true);
        }
        // Wrong portal (e.g. board session on /centrak): show this company's
        // login — never hijack the browser to a different member portal.
        if (allowed !== `/${portalMatch.route.path}` && !pathname.startsWith(`${allowed}/`) && pathname !== allowed) {
          return companyPortalLoginGate(true);
        }

        // Matching external users hitting /{company}/login go to the portal home.
        if (isLoginRest) {
          if (isOverviewPortal && !isOverviewPortalAccessAllowed(request)) {
            return companyPortalLoginGate();
          }
          const bounce = redirectExternal(`${workspaceOrigin}/${portalMatch.route.path}`);
          return applyCustomerHostRebindIfNeeded({ request, response: bounce, gate });
        }

        if (isOverviewPortal && !isOverviewPortalAccessAllowed(request)) {
          return companyPortalLoginGate(true);
        }

        const internalPath = `${portalImplBase}/${portalMatch.route.path}${portalMatch.rest}`;
        const response = rewriteTo(request, internalPath, headers, {
          ...workspaceResponseHeaders,
          "x-unit311-company-portal": portalMatch.route.path,
        });
        if (isOverviewPortal) {
          clearOverviewGateCookie(response, request);
          applyOverviewViewCookie(response, request);
        }
        return applyCustomerHostRebindIfNeeded({ request, response, gate });
      }
    }

    // Never expose the App Router implementation path on customer hosts.
    if (pathname === "/internaldashboard" || pathname.startsWith("/internaldashboard/")) {
      const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
      const view = params.get("view");
      const dest = view
        ? `${workspaceOrigin}/dashboard?view=${encodeURIComponent(view)}`
        : `${workspaceOrigin}/dashboard`;
      return redirectExternal(dest);
    }

    // Customer-host apex is always the organisation login page.
    // Never auto-enter /dashboard from a leftover Domain=.unit311central.com session
    // (e.g. after Demo/ABHI/Talanton/internal login, including Incognito multi-tab).
    if (pathname === "/" || pathname === "") {
      const bounce = redirectExternal(`${workspaceOrigin}/login${search}`);
      clearPlatformSessionCookie(bounce, request);
      return bounce;
    }

    // ABHI / Talanton / OnwardAir pre-demo portals briefing — requires an explicit portals login.
    // A normal platform session alone must not skip the portals login page.
    const isPortalsLoginPath =
      pathname === "/portals/login" || pathname.startsWith("/portals/login/");
    if (
      (workspaceSlug === ABHI_SLUG ||
        isTalantonImpactSlug(workspaceSlug) ||
        isOnwardAirSlug(workspaceSlug)) &&
      (pathname === "/portals" || pathname.startsWith("/portals/")) &&
      !isPortalsLoginPath
    ) {
      const loginUrl = isTalantonImpactSlug(workspaceSlug)
        ? `${workspaceOrigin}/portals/login`
        : `${workspaceOrigin}/login?next=${encodeURIComponent("/portals")}`;
      const token = request.cookies.get(PLATFORM_SESSION_COOKIE)?.value;
      const session = token ? await readPlatformSessionToken(token) : null;
      const portalsEntry = request.cookies.get(ABHI_PORTALS_GATE_COOKIE)?.value === "1";
      const portalsView = request.cookies.get(ABHI_PORTALS_VIEW_COOKIE)?.value === "1";
      // Address-bar / bookmark / external opens must complete login again even if a
      // short-lived view cookie remains from an earlier briefing tab.
      const fetchMode = (request.headers.get("sec-fetch-mode") ?? "").toLowerCase();
      const fetchSite = (request.headers.get("sec-fetch-site") ?? "").toLowerCase();
      const isDocumentNav = fetchMode === "navigate" || fetchMode === "";
      const isFreshEntry =
        isDocumentNav && (fetchSite === "none" || fetchSite === "cross-site");
      const allowed =
        Boolean(session) &&
        isPortalsAllowedUsername(session?.username, workspaceSlug) &&
        (isFreshEntry ? portalsEntry : portalsEntry || portalsView);

      if (!allowed) {
        const bounce = redirectExternal(loginUrl);
        if (token && (!session || !isPortalsAllowedUsername(session.username, workspaceSlug))) {
          clearPlatformSessionCookie(bounce, request);
        }
        clearAbhiPortalsGateCookie(bounce, request);
        return bounce;
      }
      const response = NextResponse.next({ request: { headers } });
      // Consume the one-time login ticket; keep a short view cookie for this tab.
      clearAbhiPortalsGateCookie(response, request);
      applyAbhiPortalsViewCookie(response, request);
      for (const [key, value] of Object.entries(workspaceResponseHeaders)) {
        response.headers.set(key, value);
      }
      response.headers.set(
        "Cache-Control",
        "private, no-cache, no-store, max-age=0, must-revalidate",
      );
      return response;
    }

    // Talanton / ABHI externals may only use login/api/static + their assigned portal.
    // Apex `/` and `/login` are the organisation entry — never hijack into /{company}.
    if (isCompanyPortalSlug(workspaceSlug)) {
      const externalGate = await evaluateCustomerHostSessionGate(request, workspaceSlug);
      if (externalGate.status === "ok" && externalGate.session.userType === "external") {
        const portalHome = canonicalizePortalRedirect(externalGate.session.redirectPath);
        const isPortalPath = matchPortalPathnameForSlug(workspaceSlug, pathname) != null;
        const isOrgEntry =
          pathname === "/login" || pathname.startsWith("/login/");
        const isAllowedUtility =
          isOrgEntry ||
          pathname.startsWith("/api/") ||
          pathname.startsWith("/_next/");

        // Broken external sessions (no portal redirect_path) must not loop login↔dashboard.
        if (!portalHome) {
          const clear = redirectExternal(`${workspaceOrigin}/login`);
          clearPlatformSessionCookie(clear, request);
          return clear;
        }

        if (!isPortalPath && !isAllowedUtility) {
          const bounce = redirectExternal(`${workspaceOrigin}${portalHome}`);
          return applyCustomerHostRebindIfNeeded({
            request,
            response: bounce,
            gate: externalGate,
          });
        }
      }
    }

    // Customer-host login stays on this origin (tenant branding).
    // Always render /login — do not bounce signed-in users to /dashboard.
    // Do NOT clear a valid session on ABHI/Talanton /login (prefetch would wipe
    // /portals mid-edit); clear only invalid/forbidden cookies.
    if (
      pathname === "/login" ||
      pathname.startsWith("/login/") ||
      (isPortalsLoginPath && isTalantonImpactSlug(workspaceSlug))
    ) {
      if (
        isTalantonImpactSlug(workspaceSlug) &&
        (pathname === "/login" || pathname.startsWith("/login/"))
      ) {
        const nextParam = request.nextUrl.searchParams.get("next");
        if (nextParam === "/portals" || nextParam?.startsWith("/portals")) {
          return redirectExternal(`${workspaceOrigin}/portals/login`);
        }
      }

      const gate = await evaluateCustomerHostSessionGate(request, workspaceSlug);
      const response = NextResponse.next({ request: { headers } });

      if (gate.status === "invalid" || gate.status === "forbidden") {
        clearPlatformSessionCookie(response, request);
      }

      if (isCompanyPortalSlug(workspaceSlug)) {
        // Real visits to portals login clear the one-time gate so /portals
        // requires completing the form again. Skip prefetch AND any request
        // that still originates from an open /portals tab (speculative loads
        // often omit prefetch headers and were clearing the gate mid-edit).
        const nextParam = request.nextUrl.searchParams.get("next");
        const wantsPortals =
          isPortalsLoginPath ||
          nextParam === "/portals" ||
          Boolean(nextParam?.startsWith("/portals"));
        const referer = request.headers.get("referer") ?? "";
        let fromPortals = false;
        try {
          fromPortals = new URL(referer).pathname.startsWith("/portals");
        } catch {
          fromPortals = false;
        }
        if (wantsPortals && !isNextPrefetchRequest(request) && !fromPortals) {
          clearAbhiPortalsGateCookie(response, request);
        }
      }

      for (const [key, value] of Object.entries(workspaceResponseHeaders)) {
        response.headers.set(key, value);
      }
      response.headers.set(
        "Cache-Control",
        "private, no-cache, no-store, max-age=0, must-revalidate",
      );
      return response;
    }

    // Password reset must stay on the customer host (tenant branding + OTP flow).
    // Without this, /resetpassword falls through to the /ws/[slug] gateway.
    if (
      pathname === "/resetpassword" ||
      pathname.startsWith("/resetpassword/") ||
      pathname === "/resetpassowrd" ||
      pathname.startsWith("/resetpassowrd/")
    ) {
      const response = NextResponse.next({ request: { headers } });
      for (const [key, value] of Object.entries(workspaceResponseHeaders)) {
        response.headers.set(key, value);
      }
      response.headers.set(
        "Cache-Control",
        "private, no-cache, no-store, max-age=0, must-revalidate",
      );
      return response;
    }

    if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
      // APIs enforce host-authoritative tenancy in workspace-context.
      // Rebind on HTML navigations; APIs resolve active workspace from host + authz.
      return NextResponse.next({ request: { headers } });
    }

    // Workspace onboarding lives at /onboarding on the customer host.
    if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
      return rewriteTo(
        request,
        `/onboarding/${encodeURIComponent(workspaceSlug)}`,
        headers,
        workspaceResponseHeaders,
      );
    }

    // Talanton EA test suite GUI (Talanton host only).
    if (pathname === "/testing" || pathname.startsWith("/testing/")) {
      if (!isTalantonImpactSlug(workspaceSlug)) {
        return redirectExternal(`${workspaceOrigin}/dashboard`);
      }

      if (isTalantonImpactSlug(workspaceSlug)) {
        const token = request.cookies.get(PLATFORM_SESSION_COOKIE)?.value;
        const session = token ? await readPlatformSessionToken(token) : null;
        if (session && isPortalsAllowedUsername(session.username, workspaceSlug)) {
          return rewriteTo(request, "/testing", headers, workspaceResponseHeaders);
        }
      }

      const gate = await evaluateCustomerHostSessionGate(request, workspaceSlug);
      if (gate.status === "anonymous" || gate.status === "invalid") {
        const bounce = customerHostLoginRedirect(workspaceOrigin, "/testing");
        if (gate.status === "invalid") {
          clearPlatformSessionCookie(bounce, request);
        }
        return bounce;
      }

      if (gate.status === "workspace_missing") {
        const gatewayPath = `${WORKSPACE_HOST_ROUTE_PREFIX}/${encodeURIComponent(workspaceSlug)}`;
        return rewriteTo(request, gatewayPath, headers, workspaceResponseHeaders);
      }

      if (gate.status === "forbidden") {
        const bounce = customerHostLoginRedirect(workspaceOrigin, "/testing");
        clearPlatformSessionCookie(bounce, request);
        return bounce;
      }

      return applyCustomerHostRebindIfNeeded({
        request,
        response: rewriteTo(request, "/testing", headers, workspaceResponseHeaders),
        gate,
      });
    }

    const requiresAuthenticatedApp =
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/") ||
      pathname === "/" ||
      pathname === "";

    if (requiresAuthenticatedApp) {
      // ABHI / Talanton demo/admin briefing accounts may use shared-password sessions without DB membership.
      if (workspaceSlug === ABHI_SLUG || isTalantonImpactSlug(workspaceSlug)) {
        const token = request.cookies.get(PLATFORM_SESSION_COOKIE)?.value;
        const session = token ? await readPlatformSessionToken(token) : null;
        if (session && isPortalsAllowedUsername(session.username, workspaceSlug)) {
          if (pathname === "/" || pathname === "") {
            const bounce = redirectExternal(`${workspaceOrigin}/dashboard${search}`);
            // Leaving the briefing surface drops the one-time portals gate.
            if (!isNextPrefetchRequest(request)) {
              clearAbhiPortalsGateCookie(bounce, request);
            }
            return bounce;
          }
          let response: NextResponse;
          const dashboardHardPath = mapHardPathToViewQuery(pathname, search);
          if (dashboardHardPath) {
            response = redirectPermanent(request, dashboardHardPath);
          } else {
            response = rewriteTo(request, "/internaldashboard", headers, workspaceResponseHeaders);
          }
          if (!isNextPrefetchRequest(request)) {
            clearAbhiPortalsGateCookie(response, request);
          }
          return response;
        }
      }

      const gate = await evaluateCustomerHostSessionGate(request, workspaceSlug);

      if (gate.status === "anonymous" || gate.status === "invalid") {
        const bounce = customerHostLoginRedirect(workspaceOrigin);
        if (gate.status === "invalid") {
          clearPlatformSessionCookie(bounce, request);
        }
        return bounce;
      }

      if (gate.status === "workspace_missing") {
        const gatewayPath = `${WORKSPACE_HOST_ROUTE_PREFIX}/${encodeURIComponent(workspaceSlug)}`;
        return rewriteTo(request, gatewayPath, headers, workspaceResponseHeaders);
      }

      if (gate.status === "forbidden") {
        const bounce = customerHostLoginRedirect(workspaceOrigin);
        clearPlatformSessionCookie(bounce, request);
        return bounce;
      }

      // Apex `/` already forced /login above. Authenticated /dashboard continues below.
      if (pathname === "/" || pathname === "") {
        return customerHostLoginRedirect(workspaceOrigin);
      }

      // Talanton / ABHI company-portal externals must not enter the admin shell.
      if (
        isCompanyPortalSlug(workspaceSlug) &&
        gate.session.userType === "external" &&
        (pathname === "/dashboard" || pathname.startsWith("/dashboard/"))
      ) {
        const portalHome = canonicalizePortalRedirect(gate.session.redirectPath);
        if (portalHome) {
          const redirect = redirectExternal(`${workspaceOrigin}${portalHome}`);
          return applyCustomerHostRebindIfNeeded({ request, response: redirect, gate });
        }
      }

      let response: NextResponse;
      const dashboardHardPath = mapHardPathToViewQuery(pathname, search);
      if (dashboardHardPath) {
        response = redirectPermanent(request, dashboardHardPath);
      } else {
        response = rewriteTo(request, "/internaldashboard", headers, workspaceResponseHeaders);
      }

      return applyCustomerHostRebindIfNeeded({ request, response, gate });
    }

    // Default: workspace gateway (sign-in landing). Avoid marketing homepage on customer hosts.
    const gatewayPath = `${WORKSPACE_HOST_ROUTE_PREFIX}/${encodeURIComponent(workspaceSlug)}`;
    return rewriteTo(request, gatewayPath, headers, workspaceResponseHeaders);
  }

  // --- Demo application host (same Internal Ops build; Demo workspace content) ---
  if (isDemoDomainHost(host)) {
    const headers = withHostHeaders(request, { demo: true });
    const shellHeaders = {
      "x-unit311-internal": "1",
      "x-unit311-demo": "1",
      "x-unit311-workspace-slug": DEMO_WORKSPACE_SLUG,
    };
    const demoOrigin = isLocalDevHost(host)
      ? `${request.nextUrl.protocol}//${host}`
      : DEMO_SITE_URL;

    if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
      return NextResponse.next({ request: { headers } });
    }

    // Apex always forces the Demo login page — never auto-enter the shell from a
    // leftover Domain=.unit311central.com session (e.g. after ABHI/Talanton/internal).
    if (pathname === "/" || pathname === "") {
      const bounce = redirectExternal(`${demoOrigin}/login${search}`);
      clearPlatformSessionCookie(bounce, request);
      return bounce;
    }

    // Keep login on the demo host (before marketing-path redirects).
    // Always render /login — do not bounce signed-in users into the platform.
    if (pathname === "/login" || pathname.startsWith("/login/")) {
      const gate = await evaluateCustomerHostSessionGate(request, DEMO_WORKSPACE_SLUG);
      const response = NextResponse.next({ request: { headers } });
      if (gate.status === "invalid" || gate.status === "forbidden") {
        clearPlatformSessionCookie(response, request);
      }
      for (const [key, value] of Object.entries(shellHeaders)) {
        response.headers.set(key, value);
      }
      response.headers.set(
        "Cache-Control",
        "private, no-cache, no-store, max-age=0, must-revalidate",
      );
      return response;
    }

    if (isPublicMarketingPath(pathname)) {
      if (isLocalDevHost(host)) {
        const port = request.nextUrl.port || "3000";
        return redirectExternal(`http://localhost:${port}${pathname}${search}`);
      }
      return redirectExternal(`${CENTRAL_SITE_URL}${pathname}${search}`);
    }

    const legacyBrowserRedirect = redirectLegacyInternalBrowserPath(request, pathname, search);
    if (legacyBrowserRedirect) return legacyBrowserRedirect;

    // Require a Demo workspace session for the platform shell.
    const gate = await evaluateCustomerHostSessionGate(request, DEMO_WORKSPACE_SLUG);
    if (
      gate.status === "anonymous" ||
      gate.status === "invalid" ||
      gate.status === "forbidden" ||
      gate.status === "workspace_missing"
    ) {
      const bounce = redirectExternal(`${demoOrigin}/login`);
      if (gate.status !== "anonymous") {
        clearPlatformSessionCookie(bounce, request);
      }
      return bounce;
    }

    // Post-login lands on /dashboard (apex `/` always clears the session).
    if (
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/") ||
      pathname === "/internaldashboard" ||
      pathname.startsWith("/internaldashboard/")
    ) {
      const response = rewriteTo(request, "/internaldashboard", headers, shellHeaders);
      return applyCustomerHostRebindIfNeeded({ request, response, gate });
    }

    const hardPathRedirect = mapHardPathToViewQuery(pathname, search);
    if (hardPathRedirect) {
      return redirectPermanent(request, hardPathRedirect);
    }

    const viewMap = legacyViewRedirects();
    if (viewMap[pathname]) {
      return redirectPermanent(request, viewMap[pathname]);
    }

    const response = rewriteTo(request, "/internaldashboard", headers, shellHeaders);
    return applyCustomerHostRebindIfNeeded({ request, response, gate });
  }

  // --- Internal application host ---
  if (isInternalDomainHost(host)) {
    const headers = withHostHeaders(request, { internal: true });

    if (pathname === "/login" || pathname.startsWith("/login/")) {
      if (isLocalDevHost(host)) {
        const port = request.nextUrl.port || "3000";
        return redirectExternal(`http://localhost:${port}/login${search}`);
      }
      return redirectExternal(`${CENTRAL_SITE_URL}/login${search}`);
    }

    if (isPublicMarketingPath(pathname)) {
      if (isLocalDevHost(host)) {
        const port = request.nextUrl.port || "3000";
        return redirectExternal(`http://localhost:${port}${pathname}${search}`);
      }
      return redirectExternal(`${CENTRAL_SITE_URL}${pathname}${search}`);
    }

    if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
      return NextResponse.next({ request: { headers } });
    }

    const legacyBrowserRedirect = redirectLegacyInternalBrowserPath(request, pathname, search);
    if (legacyBrowserRedirect) return legacyBrowserRedirect;

    if (pathname === "/" || pathname === "") {
      return rewriteTo(request, "/internaldashboard", headers, { "x-unit311-internal": "1" });
    }

    const hardPathRedirect = mapHardPathToViewQuery(pathname, search);
    if (hardPathRedirect) {
      return redirectPermanent(request, hardPathRedirect);
    }

    const viewMap = legacyViewRedirects();
    if (viewMap[pathname]) {
      return redirectPermanent(request, viewMap[pathname]);
    }

    const response = NextResponse.next({ request: { headers } });
    response.headers.set("x-unit311-internal", "1");
    return response;
  }

  // --- Public apex / www ---
  if (isPublicSiteHost(host)) {
    const headers = withHostHeaders(request, { public: true });
    // Partners signup/portal is a standalone surface — no marketing nav/footer.
    if (pathname === "/partners" || pathname.startsWith("/partners/")) {
      headers.set("x-unit311-bare-chrome", "1");
    }

    const viewMap = legacyViewRedirects();
    if (viewMap[pathname]) {
      return redirectExternal(`${INTERNAL_SITE_URL}${viewMap[pathname]}`, 308);
    }

    if (
      pathname === "/internaldashboard" ||
      pathname.startsWith("/internaldashboard/") ||
      pathname === "/testflighthub" ||
      pathname.startsWith("/testflighthub/") ||
      pathname === "/internaldashboard_grants" ||
      pathname.startsWith("/internaldashboard_grants/")
    ) {
      return redirectExternal(buildInternalHostRedirectUrl(pathname, search), 308);
    }

    return NextResponse.next({ request: { headers } });
  }

  if (isLocalDevHost(host)) {
    if (pathname === "/partners" || pathname.startsWith("/partners/")) {
      const headers = new Headers(request.headers);
      headers.set("x-unit311-bare-chrome", "1");
      return NextResponse.next({ request: { headers } });
    }
    return NextResponse.next();
  }

  if (normalizedHost.startsWith("internal.")) {
    const headers = withHostHeaders(request, { internal: true });
    const legacyBrowserRedirect = redirectLegacyInternalBrowserPath(request, pathname, search);
    if (legacyBrowserRedirect) return legacyBrowserRedirect;
    if (pathname === "/" || pathname === "") {
      return rewriteTo(request, "/internaldashboard", headers, { "x-unit311-internal": "1" });
    }
    return NextResponse.next({ request: { headers } });
  }

  if (normalizedHost.startsWith("demo.")) {
    const headers = withHostHeaders(request, { demo: true });
    const legacyBrowserRedirect = redirectLegacyInternalBrowserPath(request, pathname, search);
    if (legacyBrowserRedirect) return legacyBrowserRedirect;
    // Defer to the primary isDemoDomainHost branch above whenever possible.
    // Fallback: never serve the shell without auth.
    return redirectExternal(`${DEMO_SITE_URL}/login`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Explicitly include `/` — catch-all patterns do not match the site root.
    "/",
    // Skip static media so tenant hosts serve /videos/*.mp4 (and similar) as files, not HTML.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|mp4|webm|mov|mp3|wav|ogg)$).*)",
  ],
};
