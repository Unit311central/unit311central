import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import {
  ABHI_EA_NO_STORE_HEADERS,
  assertAbhiEaAccess,
  redirectAbhiEaApiToTesting,
} from "@/lib/abhi/ea-testing-auth";
import { runAbhiEaTestSuite } from "@/lib/abhi/ea-test-suite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const redirect = redirectAbhiEaApiToTesting(request);
  if (redirect) return redirect;

  const denied = await assertAbhiEaAccess();
  if (denied) return denied;

  const report = await runAbhiEaTestSuite();
  return NextResponse.json(report, { headers: ABHI_EA_NO_STORE_HEADERS });
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const denied = await assertAbhiEaAccess();
  if (denied) return denied;

  const report = await runAbhiEaTestSuite();
  return NextResponse.json(report, { headers: ABHI_EA_NO_STORE_HEADERS });
}
