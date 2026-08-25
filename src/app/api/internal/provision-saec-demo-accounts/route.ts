import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { provisionSaecDemoAccounts } from "@/lib/saec/provision-demo-accounts";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.INTERNAL_FILES_SETUP_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  return request.headers.get("x-setup-secret") === secret;
}

/**
 * One-shot: provision SAEC client demonstration accounts (admin@saec.biz, demo@saec.biz).
 * Password must be supplied in JSON body at runtime — never committed to source control.
 */
export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: string };
    password = String(body.password ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: "password is required in JSON body." }, { status: 400 });
  }

  try {
    const result = await provisionSaecDemoAccounts(password);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "SAEC demo account provisioning failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
