import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { resolveSaecDiscoveryProvisionPassword } from "@/lib/saec-discovery/discovery-auth";
import { provisionSaecDiscoveryAccount } from "@/lib/saec-discovery/provision-discovery-account";
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
 * One-shot: provision SAEC Discovery login (discovery@unit311central.com).
 * Password must be supplied in JSON body at runtime — never committed to source control.
 */
export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let passwordOverride: string | undefined;
  try {
    const body = (await request.json()) as { password?: string };
    if (body.password?.trim()) {
      passwordOverride = body.password.trim();
    }
  } catch {
    // Empty body is fine — resolveSaecDiscoveryProvisionPassword supplies the default.
  }

  const password = resolveSaecDiscoveryProvisionPassword(passwordOverride);

  try {
    const result = await provisionSaecDiscoveryAccount(password);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "SAEC Discovery account provisioning failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
