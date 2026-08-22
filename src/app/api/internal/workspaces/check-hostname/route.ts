import { NextRequest, NextResponse } from "next/server";

import { requireInternalWorkspacesAccess } from "@/lib/platform-workspaces/internal-workspaces-auth";
import {
  isCustomerHostnameAvailable,
} from "@/lib/platform-workspaces/workspace-host-alias-service";
import {
  isValidCustomerHostname,
  normalizeCustomerHostname,
} from "@/lib/platform-workspaces/workspace-hostname";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireInternalWorkspacesAccess(request);
  if ("error" in auth) return auth.error;

  const hostname = normalizeCustomerHostname(request.nextUrl.searchParams.get("hostname") ?? "");
  if (!hostname) {
    return NextResponse.json({ available: false, hostname, message: "Hostname is required." });
  }
  if (!isValidCustomerHostname(hostname)) {
    return NextResponse.json({
      available: false,
      hostname,
      message: "Hostname is invalid or reserved.",
    });
  }

  const available = await isCustomerHostnameAvailable(hostname);
  return NextResponse.json({
    available,
    hostname,
    message: available ? "Hostname is available." : "Hostname is already in use or reserved.",
  });
}
