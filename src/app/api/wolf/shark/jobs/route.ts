import { randomUUID } from "node:crypto";

import { after, NextResponse } from "next/server";

import { SHARK_TEST_VIDEOS } from "@/lib/wolf/shark/constants";
import { initialJob, putSharkJob, listSharkJobs } from "@/lib/wolf/shark/shark-job-store.server";
import { queueSharkJob } from "@/lib/wolf/shark/shark-runner.server";
import { requireWolfCentralWorkspace } from "@/lib/wolf/wolf-central-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ALLOWED = new Set(SHARK_TEST_VIDEOS.map((v) => v.id));

export async function GET() {
  try {
    await requireWolfCentralWorkspace();
    const jobs = listSharkJobs(30);
    return NextResponse.json({ jobs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireWolfCentralWorkspace();
    const body = (await request.json()) as { video?: string };
    const video = body.video?.trim();
    if (!video || !ALLOWED.has(video as "base.mp4" | "shark.mp4")) {
      return NextResponse.json({ error: "video must be base.mp4 or shark.mp4" }, { status: 400 });
    }

    const id = randomUUID();
    putSharkJob(initialJob(id, video));
    after(() => {
      queueSharkJob(id, video);
    });

    return NextResponse.json({ id, video, status: "QUEUED" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start job";
    const status = message.includes("WOLF Central") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
