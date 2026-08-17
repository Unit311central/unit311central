import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { join } from "node:path";

import { assertDemoMutationAllowedForRequest, isDemoAdminUsername, getDemoSessionContext } from "@/lib/demo/mutation-guard";

export const runtime = "nodejs";
export const maxDuration = 300;

function runSeed(): Promise<{ ok: boolean; output: string }> {
  const root = process.cwd();
  const scriptPath = join(root, "scripts", "demo-enterprise", "run.mjs");

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: root,
      env: { ...process.env, DEMO_ENTERPRISE_SEED: process.env.DEMO_ENTERPRISE_SEED ?? "3112025" },
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      output += String(chunk);
    });
    child.on("close", (code) => {
      resolve({ ok: code === 0, output });
    });
  });
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const ctx = await getDemoSessionContext();
  if (!ctx?.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDemoAdminUsername(ctx.session.username)) {
    return NextResponse.json(
      { error: "Only admin@unit311central.com can reset the Demo workspace." },
      { status: 403 },
    );
  }

  const result = await runSeed();
  if (!result.ok) {
    return NextResponse.json(
      { error: "Demo reset failed", detail: result.output.slice(-4000) },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Demo reset to Northstar baseline complete.",
    output: result.output.slice(-2000),
  });
}
