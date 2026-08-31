import { seedInterfaceworxTomExpenses } from "@/lib/unit311/tom-expenses-seed";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function isAuthorized(request: NextRequest) {
  const secret = process.env.INTERNAL_FILES_SETUP_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  return request.headers.get("x-setup-secret") === secret;
}

/** One-shot: import Tom's InterfaceWorx workspace expenses via canonical Finance services. */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await seedInterfaceworxTomExpenses();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "InterfaceWorx Tom expense seed failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
