import { NextRequest, NextResponse } from "next/server";

import {
  getPartnerByPortalToken,
  listPartnerInvoices,
  updatePartner,
} from "@/lib/partners/service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
    return NextResponse.json({ partner, invoices });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load portal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const { token } = await context.params;
    const partner = await getPartnerByPortalToken(token);
    if (!partner) return NextResponse.json({ error: "Partner portal not found." }, { status: 404 });
    const body = (await request.json()) as Record<string, string | null | undefined>;
    const updated = await updatePartner(partner.id, {
      firstName: body.firstName,
      lastName: body.lastName,
      companyName: body.companyName,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      city: body.city,
      district: body.district,
      country: body.country,
      postcode: body.postcode,
      phoneCountryCode: body.phoneCountryCode,
      phoneNumber: body.phoneNumber,
      accountHolder: body.accountHolder,
      bankName: body.bankName,
      bankAddress: body.bankAddress,
      accountNumber: body.accountNumber,
      sortCode: body.sortCode,
      swift: body.swift,
      iban: body.iban,
      bic: body.bic,
      routing: body.routing,
      notes: body.notes,
    });
    return NextResponse.json({ partner: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update partner";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
