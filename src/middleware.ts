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
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";
import { clearPlatformSessionCookie } from "@/lib/platform-session-cookie";

function canonicalizePortalRedirect(redirectPath: string | null | undefined): string | null {
  if (!redirectPath) return null;
  const match = matchTalantonCompanyPortalPathname(redirectPath);
  return match ? `/${match.route.path}` : null;
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
  return NextResponse.redirect(url, status);
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
 * Internal/demo hosts: rewrite `/` onto /internaldashboard (App Router); never
 * expose /internaldashboard as a public browser URL.
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

    const headers = withHostHeaders(request, { workspaceSlug });
    const workspaceOrigin = `https://${workspaceSlug}.${UNIT311_SITE_HOST}`;
    const workspaceResponseHeaders = {
      "x-unit311-workspace": "1",
      "x-unit311-workspace-slug": workspaceSlug,
    };

    // Talanton route-based company portals: /{company}/... on talantonimpact host only.
    // These URLs must NEVER fall through to the admin /internaldashboard shell.
    if (workspaceSlug === TALANTON_IMPACT_SLUG) {
      const portalMatch = matchTalantonCompanyPortalPathname(pathname);
      if (portalMatch) {
        const gate = await evaluateCustomerHostSessionGate(request, workspaceSlug);
        const isLoginRest =
          portalMatch.rest === "/login" || portalMatch.rest.startsWith("/login/");

        const companyPortalLoginRewrite = () =>
          rewriteTo(
            request,
            `/portfolio-portal/${portalMatch.route.path}/login`,
            headers,
            {
              ...workspaceResponseHeaders,
              "x-unit311-company-portal": portalMatch.route.path,
            },
          );

        // Anonymous: branded portal login (URL stays /{company} or /{company}/login).
        if (gate.status === "anonymous") {
          return companyPortalLoginRewrite();
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
          const response = companyPortalLoginRewrite();
          clearPlatformSessionCookie(response, request);
          return response;
        }

        if (gate.session.userType === "external") {
          const allowed = canonicalizePortalRedirect(gate.session.redirectPath);
          if (!allowed) {
            // Member with no company portal assignment — do not enter portal app.
            const response = companyPortalLoginRewrite();
            clearPlatformSessionCookie(response, request);
            return response;
          }
          if (allowed !== `/${portalMatch.route.path}` && !pathname.startsWith(allowed)) {
            const bounce = redirectExternal(`${workspaceOrigin}${allowed}`);
            return applyCustomerHostRebindIfNeeded({ request, response: bounce, gate });
          }
        }
        // Signed-in users hitting /{company}/login go to the portal home.
        if (isLoginRest) {
          const bounce = redirectExternal(`${workspaceOrigin}/${portalMatch.route.path}`);
          return applyCustomerHostRebindIfNeeded({ request, response: bounce, gate });
        }
        const internalPath = `/portfolio-portal/${portalMatch.route.path}${portalMatch.rest}`;
        const response = rewriteTo(request, internalPath, headers, {
          ...workspaceResponseHeaders,
          "x-unit311-company-portal": portalMatch.route.path,
        });
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

    // Talanton externals may only use login/api/static + their assigned company portal.
    if (workspaceSlug === TALANTON_IMPACT_SLUG) {
      const externalGate = await evaluateCustomerHostSessionGate(request, workspaceSlug);
      if (externalGate.status === "ok" && externalGate.session.userType === "external") {
        const portalHome = canonicalizePortalRedirect(externalGate.session.redirectPath);
        const isPortalPath = matchTalantonCompanyPortalPathname(pathname) != null;
        const isAllowedUtility =
          pathname === "/login" ||
          pathname.startsWith("/login/") ||
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
    if (pathname === "/login" || pathname.startsWith("/login/")) {
      const gate = await evaluateCustomerHostSessionGate(request, workspaceSlug);
      if (gate.status === "ok") {
        if (gate.session.userType === "external" && workspaceSlug === TALANTON_IMPACT_SLUG) {
          const portalHome = canonicalizePortalRedirect(gate.session.redirectPath);
          if (!portalHome) {
            // Avoid redirect loop: clear broken session and show login once.
            const response = NextResponse.next({ request: { headers } });
            clearPlatformSessionCookie(response, request);
            for (const [key, value] of Object.entries(workspaceResponseHeaders)) {
              response.headers.set(key, value);
            }
            response.headers.set(
              "Cache-Control",
              "private, no-cache, no-store, max-age=0, must-revalidate",
            );
            return response;
          }
          const redirect = redirectExternal(`${workspaceOrigin}${portalHome}`);
          return applyCustomerHostRebindIfNeeded({ request, response: redirect, gate });
        }
        const redirect = redirectExternal(`${workspaceOrigin}/dashboard${search}`);
        return applyCustomerHostRebindIfNeeded({ request, response: redirect, gate });
      }
      const response = NextResponse.next({ request: { headers } });
      for (const [key, value] of Object.entries(workspaceResponseHeaders)) {
        response.headers.set(key, value);
      }
      response.headers.set("Cache-Control", "private, no-cache, no-store, max-age=0, must-revalidate");
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

    const requiresAuthenticatedApp =
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/") ||
      pathname === "/" ||
      pathname === "";

    if (requiresAuthenticatedApp) {
      const gate = await evaluateCustomerHostSessionGate(request, workspaceSlug);

      if (gate.status === "anonymous" || gate.status === "invalid") {
        return customerHostLoginRedirect(workspaceOrigin);
      }

      if (gate.status === "workspace_missing") {
        const gatewayPath = `${WORKSPACE_HOST_ROUTE_PREFIX}/${encodeURIComponent(workspaceSlug)}`;
        return rewriteTo(request, gatewayPath, headers, workspaceResponseHeaders);
      }

      if (gate.status === "forbidden") {
        return customerHostLoginRedirect(workspaceOrigin);
      }

      // Signed-in users hitting the splash go straight into the workspace app.
      if (pathname === "/" || pathname === "") {
        const portalHome =
          gate.session.userType === "external" &&
          workspaceSlug === TALANTON_IMPACT_SLUG
            ? canonicalizePortalRedirect(gate.session.redirectPath)
            : null;
        const redirect = redirectExternal(
          `${workspaceOrigin}${portalHome || "/dashboard"}${search}`,
        );
        return applyCustomerHostRebindIfNeeded({ request, response: redirect, gate });
      }

      // Talanton company portal externals must not enter the admin shell.
      if (
        workspaceSlug === TALANTON_IMPACT_SLUG &&
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

    if (pathname === "/login" || pathname.startsWith("/login/")) {
      if (isLocalDevHost(host)) {
        const port = request.nextUrl.port || "3000";
        return redirectExternal(`http://localhost:${port}/login${search}`);
      }
      const loginUrl = new URL(`${CENTRAL_SITE_URL}/login`);
      loginUrl.search = search;
      loginUrl.searchParams.set("return_to", DEMO_SITE_URL);
      return redirectExternal(loginUrl.toString());
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
      return rewriteTo(request, "/internaldashboard", headers, shellHeaders);
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
    for (const [key, value] of Object.entries(shellHeaders)) {
      response.headers.set(key, value);
    }
    return response;
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
    if (pathname === "/" || pathname === "") {
      return rewriteTo(request, "/internaldashboard", headers, {
        "x-unit311-internal": "1",
        "x-unit311-demo": "1",
      });
    }
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Explicitly include `/` — catch-all patterns do not match the site root.
    "/",
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
