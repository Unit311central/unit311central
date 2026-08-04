import { NextRequest, NextResponse } from "next/server";

import { verifyPlatformPasswordResetOtp } from "@/lib/password-reset/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: string; otp?: string };

    if (!body.token?.trim() || !body.otp?.trim()) {
      return NextResponse.json(
        { error: "Reset token and one-time code are required." },
        { status: 400 },
      );
    }

    const result = await verifyPlatformPasswordResetOtp({
      token: body.token,
      otp: body.otp,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify code.";
    const status =
      message.includes("incorrect") ||
      message.includes("expired") ||
      message.includes("invalid") ||
      message.includes("Enter the") ||
      message.includes("Too many")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
