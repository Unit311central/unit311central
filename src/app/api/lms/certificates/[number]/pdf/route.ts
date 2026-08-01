import { NextRequest, NextResponse } from "next/server";

import { requireLmsWorkspaceSession } from "@/lib/lms/auth";
import { buildLmsCertificatePdf } from "@/lib/lms/certificate-pdf";
import { getCertificateByNumber } from "@/lib/lms/service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ number: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;

  try {
    const { number } = await params;
    const certificateNumber = decodeURIComponent(number);
    const certificate = await getCertificateByNumber(
      auth.workspace.id,
      certificateNumber,
    );
    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
    }

    if (
      auth.session.userType !== "internal" &&
      certificate.userId !== auth.session.sub
    ) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const origin = request.nextUrl.origin;
    const verifyUrl = `${origin}/api/lms/certificates/verify?token=${certificate.verifyToken}`;
    const pdf = buildLmsCertificatePdf({
      certificate,
      workspaceName: auth.workspace.name,
      verifyUrl,
    });

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${certificate.certificateNumber}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
