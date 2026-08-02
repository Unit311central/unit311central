import { NextRequest, NextResponse } from "next/server";

import { getRequestHost, isPublicSiteHost } from "@/lib/app-domains";
import { insertMarketingEvent } from "@/lib/website-analytics/service";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "page_view",
  "cta_click",
  "contact_submit",
  "demo_request",
]);

function countryFromRequest(request: NextRequest): string | null {
  const headers = request.headers;
  const raw =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country-code") ||
    null;
  if (!raw) return null;
  const code = String(raw).trim().toUpperCase();
  if (!code || code === "XX" || code === "T1") return null;
  return code.slice(0, 8);
}

/**
 * Public marketing-site event ingest (apex / www only).
 */
export async function POST(request: NextRequest) {
  try {
    const host = getRequestHost(request);
    if (!isPublicSiteHost(host) && process.env.NODE_ENV === "production") {
      // Allow local/preview testing on non-public hosts in non-production.
      if (!host?.includes("localhost") && !host?.includes("vercel.app")) {
        return NextResponse.json({ ok: false, error: "Host not eligible." }, { status: 403 });
      }
    }

    const body = (await request.json().catch(() => ({}))) as {
      eventType?: string;
      path?: string;
      label?: string;
      meta?: Record<string, unknown>;
    };

    const eventType = String(body.eventType ?? "").trim();
    if (!ALLOWED_TYPES.has(eventType)) {
      return NextResponse.json({ ok: false, error: "Invalid eventType." }, { status: 400 });
    }

    const path = String(body.path ?? "/").slice(0, 500);
    const clientMeta =
      body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
        ? body.meta
        : {};
    const country = countryFromRequest(request);
    const meta: Record<string, unknown> = {
      ...clientMeta,
      ...(country ? { country } : {}),
    };

    const result = await insertMarketingEvent({
      eventType,
      path,
      label: body.label?.slice(0, 200) ?? null,
      meta,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record event.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
