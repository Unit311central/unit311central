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
import { businessContextForPermissionProfile, businessContextForWorkspace } from "@/lib/ea-acceptance/workspace-context";
import { validateWorkspaceFingerprint } from "@/lib/ea-acceptance/workspace-fingerprints";
import type { EaAcceptancePermissionProfile, EaAcceptanceQuestionKind } from "@/lib/ea-acceptance/types";

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
    questionId?: string;
    prompt?: string;
    kind?: EaAcceptanceQuestionKind;
    expectCapabilityId?: string;
    permissionProfile?: EaAcceptancePermissionProfile;
    workspaceSlug?: string;
  };

  if (body.prompt?.trim()) {
    const business = body.permissionProfile
      ? businessContextForPermissionProfile(body.permissionProfile, body.workspaceSlug)
      : body.workspaceSlug
        ? businessContextForWorkspace(body.workspaceSlug)
        : demoEaTestBusiness();
    const execution = await executeEaAcceptanceCase(
      {
        id: `probe-${Date.now()}`,
        prompt: body.prompt.trim(),
        kind: body.kind ?? "data",
        expectCapabilityId: body.expectCapabilityId,
        permissionProfile: body.permissionProfile,
      },
      business,
      { executeTools: true },
    );
    const workspaceSlug = body.workspaceSlug ?? business.workspace.slug;
    const fingerprint = validateWorkspaceFingerprint(workspaceSlug, String(execution.text ?? ""), {
      requiresCashEvidence: /\b(cash|bank|financial position|runway)\b/i.test(body.prompt),
    });
    return NextResponse.json(
      { ...execution, workspaceSlug, workspaceFingerprint: fingerprint },
      { headers: DEMO_EA_NO_STORE_HEADERS },
    );
  }

  const questionId = body.questionId;
  if (!questionId) {
    return NextResponse.json(
      { error: "questionId or prompt is required" },
      { status: 400, headers: DEMO_EA_NO_STORE_HEADERS },
    );
  }

  const bank = buildNorthstarEaTestBank();
  const question = bank.flatMap((s) => s.questions).find((q) => q.id === questionId);
  if (!question) {
    return NextResponse.json({ error: "Unknown question id" }, { status: 404, headers: DEMO_EA_NO_STORE_HEADERS });
  }

  const result = await runNorthstarEaTestQuestion(question, demoEaTestBusiness());
  return NextResponse.json(result, { headers: DEMO_EA_NO_STORE_HEADERS });
}
