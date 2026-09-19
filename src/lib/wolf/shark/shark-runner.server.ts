import "server-only";

import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { SharkTestResultPayload } from "@/lib/wolf/shark/types";
import {
  getSharkJob,
  patchSharkJob,
} from "@/lib/wolf/shark/shark-job-store.server";

const ALLOWED_VIDEOS = new Set(["base.mp4", "shark.mp4"]);

function wolfAiRepoRoot(): string {
  const configured = process.env.WOLF_AI_REPO_PATH?.trim();
  if (configured) return configured;
  const sibling = path.join(process.cwd(), "..", "wolf-ai");
  return sibling;
}

async function runViaHttp(
  apiBase: string,
  video: string,
): Promise<{ status: string; error?: string; result?: SharkTestResultPayload | null }> {
  const start = await fetch(`${apiBase.replace(/\/$/, "")}/api/wolf/shark/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ video }),
  });
  if (!start.ok) {
    return { status: "FAILED", error: `SHARK API start failed: ${start.status}` };
  }
  const { id } = (await start.json()) as { id: string };
  for (let i = 0; i < 3600; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(`${apiBase.replace(/\/$/, "")}/api/wolf/shark/jobs/${id}`);
    if (!poll.ok) continue;
    const body = (await poll.json()) as {
      status: string;
      error?: string;
      result?: SharkTestResultPayload | null;
    };
    if (body.status === "COMPLETED" || body.status === "FAILED") {
      return body;
    }
  }
  return { status: "FAILED", error: "SHARK API job timed out" };
}

async function runViaPython(
  jobId: string,
  video: string,
): Promise<{ status: string; error?: string; result?: SharkTestResultPayload | null }> {
  const repo = wolfAiRepoRoot();
  const workDir = path.join(repo, "artifacts", "shark", "central-jobs", jobId);
  await mkdir(workDir, { recursive: true });
  const outFile = path.join(workDir, "result.json");

  return new Promise((resolve) => {
    const python = process.env.WOLF_AI_PYTHON?.trim() || "python3";
    const script = path.join(repo, "scripts", "shark_job_once.py");
    const child = spawn(python, [script, video, "--out", outFile], {
      cwd: repo,
      env: {
        ...process.env,
        PYTHONPATH: repo,
      },
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("close", async (code) => {
      try {
        const raw = await readFile(outFile, "utf-8");
        const parsed = JSON.parse(raw) as {
          status: string;
          error?: string | null;
          result?: SharkTestResultPayload | null;
        };
        resolve({
          status: parsed.status,
          error: parsed.error ?? undefined,
          result: parsed.result ?? null,
        });
      } catch {
        resolve({
          status: code === 0 ? "FAILED" : "FAILED",
          error: stderr.slice(0, 2000) || `shark_job_once exited ${code}`,
        });
      }
    });
  });
}

export async function executeSharkJob(jobId: string, video: string): Promise<void> {
  if (!ALLOWED_VIDEOS.has(video)) {
    patchSharkJob(jobId, { status: "FAILED", error: "Invalid video", progress: 0 });
    return;
  }

  patchSharkJob(jobId, { status: "PROCESSING", progress: 0.15 });

  const apiBase = process.env.WOLF_AI_SHARK_API_URL?.trim();
  const outcome = apiBase
    ? await runViaHttp(apiBase, video)
    : await runViaPython(jobId, video);

  const status = outcome.status === "COMPLETED" ? "COMPLETED" : "FAILED";
  patchSharkJob(jobId, {
    status,
    progress: 1,
    error: outcome.error ?? null,
    result: outcome.result ?? null,
  });

  try {
    const { persistSharkTestResult } = await import("@/lib/wolf/shark/shark-persistence.server");
    await persistSharkTestResult(jobId, video, outcome.result);
  } catch {
    // persistence optional until migration applied
  }
}

export function queueSharkJob(jobId: string, video: string): void {
  void executeSharkJob(jobId, video);
}
