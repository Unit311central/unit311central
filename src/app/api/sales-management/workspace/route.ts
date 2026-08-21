import { NextResponse } from "next/server";

import {
  buildSectionPayload,
  resolveSalesManagementAuth,
  salesManagementErrorResponse,
  type SalesManagementSection,
} from "@/lib/sales-management-api";

export const dynamic = "force-dynamic";

const SECTIONS = new Set<SalesManagementSection>([
  "dashboard",
  "my-sales",
  "sales-team",
  "activities",
  "targets",
  "performance",
  "forecast",
  "commissions",
  "reports",
]);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const section = (url.searchParams.get("section") ?? "dashboard") as SalesManagementSection;
    if (!SECTIONS.has(section)) {
      return NextResponse.json({ error: "Unknown section." }, { status: 400 });
    }
    const auth = await resolveSalesManagementAuth();
    const payload = buildSectionPayload(section, auth);
    return NextResponse.json(payload);
  } catch (error) {
    return salesManagementErrorResponse(error);
  }
}
