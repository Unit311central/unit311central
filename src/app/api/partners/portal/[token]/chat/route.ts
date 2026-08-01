import { NextRequest, NextResponse } from "next/server";

import { answerPartnerPortalChat } from "@/lib/partners/portal-chat";
import { getPartnerByPortalToken, listPartnerInvoices } from "@/lib/partners/service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { token } = await context.params;
    const partner = await getPartnerByPortalToken(token);
    if (!partner) return NextResponse.json({ error: "Partner portal not found." }, { status: 404 });

    const body = (await request.json()) as { message?: string };
    const message = String(body.message || "").trim();
    if (!message) {
      return NextResponse.json({ error: "Please enter a message." }, { status: 400 });
    }

    const invoices = await listPartnerInvoices(partner.id);
    const reply = answerPartnerPortalChat({ partner, invoices, message });
    return NextResponse.json({ reply, invoiceCount: invoices.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to answer chat";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
