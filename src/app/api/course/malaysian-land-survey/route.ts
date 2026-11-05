import { NextRequest, NextResponse } from "next/server";

import {
  COURSE_DUPLICATE_MESSAGE,
  parseCourseSubmission,
} from "@/lib/course/malaysian-land-survey";
import { insertCourseSubmission } from "@/lib/course/malaysian-land-survey-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The questionnaire could not be read. Please try again." },
      { status: 400, headers: NO_STORE },
    );
  }

  const parsed = parseCourseSubmission(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.message }, { status: 400, headers: NO_STORE });
  }

  const result = await insertCourseSubmission(parsed.value);
  if (result.ok) {
    return NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });
  }
  if (result.reason === "duplicate") {
    return NextResponse.json(
      { error: COURSE_DUPLICATE_MESSAGE },
      { status: 409, headers: NO_STORE },
    );
  }
  if (result.reason === "unavailable") {
    return NextResponse.json(
      { error: "The questionnaire is not available right now. Please try again later." },
      { status: 503, headers: NO_STORE },
    );
  }
  return NextResponse.json(
    { error: "We could not submit your questionnaire. Please try again." },
    { status: 500, headers: NO_STORE },
  );
}
