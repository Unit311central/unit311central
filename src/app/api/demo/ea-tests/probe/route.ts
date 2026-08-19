import { NextRequest, NextResponse } from "next/server";

import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import {
  assertDemoEaAccess,
  DEMO_EA_NO_STORE_HEADERS,
  redirectDemoEaApiToTesting,
} from "@/lib/demo/ea-testing-auth";
import { executeEaAcceptanceCase } from "@/lib/ea-acceptance/execute-case";
import { businessContextForPermissionProfile } from "@/lib/ea-acceptance/workspace-context";
import { demoEaTestBusiness } from "@/lib/demo/ea-comprehensive-test-suite";
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

  const body = (await request.json()) as {
    prompt?: string;
    kind?: EaAcceptanceQuestionKind;
    expectCapabilityId?: string;
    permissionProfile?: "executive" | "manager" | "employee" | "sales_rep";
  };

  const prompt = String(body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400, headers: DEMO_EA_NO_STORE_HEADERS });
  }

  const kind = body.kind ?? "data";
  const business = body.permissionProfile
    ? businessContextForPermissionProfile(body.permissionProfile)
    : demoEaTestBusiness();

  const execution = await executeEaAcceptanceCase(
    {
      id: `probe-${Date.now()}`,
      prompt,
      kind,
      expectCapabilityId: body.expectCapabilityId,
    },
    business,
    { executeTools: true },
  );

  return NextResponse.json(execution, { headers: DEMO_EA_NO_STORE_HEADERS });
}
