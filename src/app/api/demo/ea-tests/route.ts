import { NextRequest, NextResponse } from "next/server";

import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import {
  assertDemoEaAccess,
  DEMO_EA_NO_STORE_HEADERS,
  redirectDemoEaApiToTesting,
} from "@/lib/demo/ea-testing-auth";
import {
  getNorthstarEaTestBankSections,
  runNorthstarEaComprehensiveSuite,
} from "@/lib/demo/ea-comprehensive-test-suite";
import { countNorthstarEaTestQuestions } from "@/lib/demo/ea-module-test-bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const redirect = redirectDemoEaApiToTesting(request);
  if (redirect) return redirect;
  const denied = await assertDemoEaAccess();
  if (denied) return denied;

  const sections = getNorthstarEaTestBankSections();
  return NextResponse.json(
    {
      sections,
      totalQuestions: countNorthstarEaTestQuestions(sections),
      version: "northstar-ea-comprehensive-v1",
    },
    { headers: DEMO_EA_NO_STORE_HEADERS },
  );
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const redirect = redirectDemoEaApiToTesting(request);
  if (redirect) return redirect;
  const denied = await assertDemoEaAccess();
  if (denied) return denied;

  const body = (await request.json().catch(() => ({}))) as {
    sectionId?: string;
    questionIds?: string[];
  };

  const report = await runNorthstarEaComprehensiveSuite({
    sectionId: body.sectionId,
    questionIds: body.questionIds,
  });

  return NextResponse.json(report, { headers: DEMO_EA_NO_STORE_HEADERS });
}
