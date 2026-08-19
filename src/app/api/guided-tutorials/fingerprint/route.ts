import { NextResponse } from "next/server";

import { GUIDED_TUTORIALS_FINGERPRINT } from "@/lib/guided-tutorials/fingerprint";
import { listTutorialDefinitions } from "@/lib/guided-tutorials/registry";

/** Public read-only deploy + catalogue marker for guided tutorials. */
export async function GET() {
  return NextResponse.json({
    fingerprint: GUIDED_TUTORIALS_FINGERPRINT,
    tutorials: listTutorialDefinitions().map((tutorial) => ({
      tutorialId: tutorial.tutorialId,
      viewId: tutorial.viewId,
      title: tutorial.title,
      stepCount: tutorial.steps.length,
    })),
  });
}
