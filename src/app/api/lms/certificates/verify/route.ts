import { NextRequest, NextResponse } from "next/server";

import { getCertificateByVerifyToken } from "@/lib/lms/service";

export const dynamic = "force-dynamic";

/** Public certificate verification by token (QR / share link). */
export async function GET(request: NextRequest) {
  try {
    const token = String(request.nextUrl.searchParams.get("token") ?? "").trim();
    if (!token) {
      return NextResponse.json({ error: "token is required." }, { status: 400 });
    }

    const certificate = await getCertificateByVerifyToken(token);
    if (!certificate) {
      return NextResponse.json({ valid: false, error: "Certificate not found." }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        learnerName: certificate.learnerName,
        companyName: certificate.companyName,
        courseTitle: certificate.courseTitle,
        score: certificate.score,
        issuedAt: certificate.issuedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
