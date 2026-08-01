import { NextRequest, NextResponse } from "next/server";

import { createPartnerInvoice, getPartnerByPortalToken, listPartnerInvoices } from "@/lib/partners/service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const { token } = await context.params;
    const partner = await getPartnerByPortalToken(token);
    if (!partner) return NextResponse.json({ error: "Partner portal not found." }, { status: 404 });
    const invoices = await listPartnerInvoices(partner.id);
    return NextResponse.json({ invoices });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load invoices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const { token } = await context.params;
    const partner = await getPartnerByPortalToken(token);
    if (!partner) return NextResponse.json({ error: "Partner portal not found." }, { status: 404 });

    const form = await request.formData();
    const jobReference = String(form.get("jobReference") || "").trim();
    const description = String(form.get("description") || "").trim();
    const amountRaw = String(form.get("amount") || "").trim();
    const file = form.get("file");
    if (!jobReference) {
      return NextResponse.json({ error: "Job reference is required." }, { status: 400 });
    }

    const invoice = await createPartnerInvoice({
      partnerId: partner.id,
      jobReference,
      description: description || null,
      amount: amountRaw ? Number(amountRaw) : null,
      file: file instanceof File ? file : null,
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit invoice";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
