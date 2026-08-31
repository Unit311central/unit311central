import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { getRequestHost, isInternalDomainHost } from "@/lib/app-domains";
import { isSentryEnabled } from "@/lib/sentry/config";
import { applySentryRequestContext } from "@/lib/sentry/request-context";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_FILES_SETUP_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  return request.headers.get("x-setup-secret") === secret;
}

function testRouteAllowed(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  return process.env.SENTRY_ENABLE_TEST_ROUTE === "1";
}

/**
 * Controlled Sentry verification — internal host + setup secret only.
 * Never enabled on production unless SENTRY_ENABLE_TEST_ROUTE=1 is explicitly set.
 */
export async function POST(request: NextRequest) {
  const host = getRequestHost(request);
  if (!isInternalDomainHost(host)) {
    return NextResponse.json({ error: "Internal host only." }, { status: 403 });
  }

  if (!testRouteAllowed()) {
    return NextResponse.json({ error: "Sentry test route is disabled." }, { status: 403 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isSentryEnabled()) {
    return NextResponse.json(
      { error: "Sentry is not configured (SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN)." },
      { status: 503 },
    );
  }

  applySentryRequestContext({
    host,
    workspaceSlug: request.headers.get("x-unit311-workspace-slug"),
  });

  const testError = new Error("Unit311 Sentry controlled test event");
  Sentry.captureException(testError, {
    tags: {
      sentry_test: "controlled",
      unit311_control_plane: "internal",
    },
    extra: {
      purpose: "post-integration verification",
      route: "/api/internal/sentry-test",
    },
  });

  await Sentry.flush(2000);

  return NextResponse.json({
    ok: true,
    message: "Controlled test event sent to Sentry. Verify in the Sentry Issues dashboard.",
  });
}
