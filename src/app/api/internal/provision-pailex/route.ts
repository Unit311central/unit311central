import { provisionPailexWorkspace } from "@/lib/pailex/provision-pailex-service";
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
 * One-shot: provision PAILEX customer workspace (pailex / pailex.unit311central.com).
 */
export async function POST(request: NextRequest) {
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
    const result = await provisionPailexWorkspace(password);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "PAILEX provisioning failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
