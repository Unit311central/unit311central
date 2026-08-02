import { NextRequest, NextResponse } from "next/server";

import { sendContactEnquiry } from "@/lib/contact/service";
import { insertMarketingEvent } from "@/lib/website-analytics/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      firstName?: string;
      surname?: string;
      organisation?: string;
      role?: string;
      email?: string;
      subject?: string;
      message?: string;
      name?: string;
      company?: string;
    };

    const result = await sendContactEnquiry(body);
    void insertMarketingEvent({
      eventType: "contact_submit",
      path: "/contact",
      label: "contact_form",
      meta: { subject: body.subject ?? null },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send enquiry";
    const status =
      message.includes("required") ||
      message.includes("valid email") ||
      message.includes("too long")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
