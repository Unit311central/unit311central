import { NextResponse } from "next/server";

import { EmailServiceError } from "@/lib/email/types";

export function emailErrorResponse(error: unknown, fallback = "Email request failed.") {
  if (error instanceof EmailServiceError) {
    const status =
      error.code === "NOT_CONFIGURED"
        ? 503
        : error.code === "NOT_FOUND"
          ? 404
          : error.code === "SEND_FAILED"
            ? 502
            : 503;

    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }

  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}
