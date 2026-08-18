import { NextRequest, NextResponse } from "next/server";

import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import {
  assertDemoEaAccess,
  DEMO_EA_NO_STORE_HEADERS,
  redirectDemoEaApiToTesting,
} from "@/lib/demo/ea-testing-auth";
import {
  buildNorthstarEaModuleReportPdf,
  buildNorthstarEaSummaryReportPdf,
  runNorthstarEaComprehensiveSuite,
} from "@/lib/demo/ea-comprehensive-test-suite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const redirect = redirectDemoEaApiToTesting(request);
  if (redirect) return redirect;
  const denied = await assertDemoEaAccess();
  if (denied) return denied;

  const body = (await request.json().catch(() => ({}))) as {
    type?: "summary" | "module";
    sectionId?: string;
    section?: {
      label: string;
      passed: number;
      failed: number;
      results: Array<{
        id: string;
        prompt: string;
        moduleLabel: string;
        subModuleLabel?: string;
        status: "pass" | "fail";
        routeKind: string;
        tool?: string;
        summary?: string;
        durationMs: number;
        error?: string;
      }>;
    };
  };

  if (body.type === "summary") {
    const report = await runNorthstarEaComprehensiveSuite(
      body.sectionId ? { sectionId: body.sectionId } : undefined,
    );
    const pdf = buildNorthstarEaSummaryReportPdf(report);
    return new NextResponse(pdf, {
      headers: {
        ...DEMO_EA_NO_STORE_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="northstar-ea-summary.pdf"',
      },
    });
  }

  if (body.section) {
    const pdf = buildNorthstarEaModuleReportPdf(body.section);
    const slug = body.section.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return new NextResponse(pdf, {
      headers: {
        ...DEMO_EA_NO_STORE_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="northstar-ea-${slug}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid PDF request" }, { status: 400, headers: DEMO_EA_NO_STORE_HEADERS });
}
