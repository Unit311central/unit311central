import { NextResponse } from "next/server";

import { requireLmsWorkspaceSession } from "@/lib/lms/auth";
import { listCertificatesForUser } from "@/lib/lms/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;

  try {
    const certificates = await listCertificatesForUser(
      auth.workspace.id,
      auth.session.sub,
    );
    return NextResponse.json({ certificates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list certificates.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
