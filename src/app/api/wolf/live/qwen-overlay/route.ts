import { NextResponse } from "next/server";

import { askQwenAboutLaptop } from "@/lib/wolf/qwen-laptop-client";
import { requireWolfCentralWorkspace } from "@/lib/wolf/wolf-central-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_FRAME_BYTES = 700_000;

function authFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "Authentication required.";
  const status = message.includes("only available") ? 403 : 401;
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    await requireWolfCentralWorkspace();
  } catch (error) {
    return authFailure(error);
  }

  const type = request.headers.get("content-type") ?? "";
  if (!type.includes("image/jpeg")) {
    return NextResponse.json({ error: "Send a JPEG frame." }, { status: 415 });
  }
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength < 32 || bytes.byteLength > MAX_FRAME_BYTES) {
    return NextResponse.json({ error: "Frame is empty or too large." }, { status: 413 });
  }

  const result = await askQwenAboutLaptop(bytes);
  return NextResponse.json(result, { status: result.configured ? 200 : 503 });
}
