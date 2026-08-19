import { NextRequest, NextResponse } from "next/server";

import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import {
  assertDemoEaAccess,
  DEMO_EA_NO_STORE_HEADERS,
  redirectDemoEaApiToTesting,
} from "@/lib/demo/ea-testing-auth";
import { runNorthstarEaTestQuestion } from "@/lib/demo/ea-question-runner";
import { demoEaTestBusiness } from "@/lib/demo/ea-comprehensive-test-suite";
import { buildNorthstarEaTestBank } from "@/lib/demo/ea-module-test-bank";
import { executeEaAcceptanceCase } from "@/lib/ea-acceptance/execute-case";
import type { EaAcceptanceQuestionKind } from "@/lib/ea-acceptance/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const redirect = redirectDemoEaApiToTesting(request);
  if (redirect) return redirect;
  const denied = await assertDemoEaAccess();
  if (denied) return denied;

  const body = (await request.json()) as { questionId: string };
  const bank = buildNorthstarEaTestBank();
  const question = bank.flatMap((s) => s.questions).find((q) => q.id === body.questionId);
  if (!question) {
    return NextResponse.json({ error: "Unknown question id" }, { status: 404, headers: DEMO_EA_NO_STORE_HEADERS });
  }

  const result = await runNorthstarEaTestQuestion(question, demoEaTestBusiness());
  return NextResponse.json(result, { headers: DEMO_EA_NO_STORE_HEADERS });
}
