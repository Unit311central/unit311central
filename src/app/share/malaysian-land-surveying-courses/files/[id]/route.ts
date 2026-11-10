import { NextResponse } from "next/server";

import { createMalaysianLandSurveyCourseDownload } from "@/lib/course/malaysian-land-survey-courses-share";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const download = await createMalaysianLandSurveyCourseDownload(id);
  if (!download) {
    return new Response("File not found.", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const response = NextResponse.redirect(download.url, 302);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
