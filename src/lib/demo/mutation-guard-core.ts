import { NextResponse } from "next/server";

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import {
  demoMutationBlockedMessage,
  isDemoReadOnlySession,
} from "@/lib/demo/read-only";
import type { PlatformSession } from "@/lib/platform-session-token";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Demo prospect sessions may POST to these paths (EA, auth, analytics, public webhooks).
 * All other /api/* mutations are blocked when assertDemoMutationAllowed applies.
 */
export const DEMO_MUTATION_EXEMPT_API_PREFIXES = [
  "/api/auth/",
  "/api/executive-assistant/",
  "/api/demo/board-deck",
  "/api/demo/preview-workspace",
  "/api/telemetry",
  "/api/website-analytics/",
  "/api/platform-analytics/",
  "/api/contact",
  "/api/whatsapp/inbound",
  "/api/financials/wise/webhook",
  "/api/partners/portal/",
  "/api/support-lounge/",
  "/api/crm/report-chat/",
  "/api/book/founder-session",
  "/api/executivecall/",
  "/api/marketing/",
  "/api/module-review/submit",
  "/api/payment/",
] as const;

export function isApiMutationMethod(method: string): boolean {
  return MUTATION_METHODS.has(method.toUpperCase());
}

export function isDemoMutationExemptApiPath(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  return DEMO_MUTATION_EXEMPT_API_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix),
  );
}

export function demoMutationBlockedResponse(): NextResponse {
  return NextResponse.json({ error: demoMutationBlockedMessage() }, { status: 403 });
}

export function evaluateDemoProspectMutationBlock(input: {
  session: PlatformSession | null;
  workspaceSlug?: string | null;
  requireSession?: boolean;
}): NextResponse | null {
  if (!input.session) {
    return input.requireSession
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : null;
  }
  const workspaceSlug = input.workspaceSlug ?? input.session.workspaceSlug ?? DEMO_WORKSPACE_SLUG;
  if (
    isDemoReadOnlySession({
      workspaceSlug,
      username: input.session.username,
    })
  ) {
    return demoMutationBlockedResponse();
  }
  return null;
}
