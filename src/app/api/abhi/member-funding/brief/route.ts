import { NextRequest, NextResponse } from "next/server";

import { buildAbhiFundingBriefDocx, abhiFundingBriefDocxFileName } from "@/lib/abhi/funding-brief-docx";
import { buildAbhiFundingBriefPdf, abhiFundingBriefPdfFileName } from "@/lib/abhi/funding-brief-pdf";
import { buildAbhiFundingDashboard } from "@/lib/abhi/member-funding-data";
import { getMemberPortalByPath } from "@/lib/abhi/member-portal-routes";
import { PLATFORM_SESSION_COOKIE, readPlatformSessionToken } from "@/lib/platform-session-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const company = request.nextUrl.searchParams.get("company")?.trim().toLowerCase();
  const format = (request.nextUrl.searchParams.get("format") || "pdf").toLowerCase();
  if (!company) {
    return NextResponse.json({ error: "company is required" }, { status: 400 });
  }

  const route = getMemberPortalByPath(company);
  if (!route || route.portalKind === "board") {
    return NextResponse.json({ error: "Unknown member portal" }, { status: 404 });
  }

  const token = request.cookies.get(PLATFORM_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await readPlatformSessionToken(token);
  if (!session || session.userType !== "external") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const allowed = getMemberPortalByPath(session.redirectPath);
  if (!allowed || allowed.clientId !== route.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dashboard = buildAbhiFundingDashboard(route.clientId, route.displayName);

  if (format === "docx" || format === "word") {
    const buffer = await buildAbhiFundingBriefDocx(dashboard);
    const filename = abhiFundingBriefDocxFileName(route.displayName);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const buffer = buildAbhiFundingBriefPdf(dashboard);
  const filename = abhiFundingBriefPdfFileName(route.displayName);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
