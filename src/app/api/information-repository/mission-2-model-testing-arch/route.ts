import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { requireInterfaceWorxWorkspaceSession } from "@/lib/interface-worx-information-repository-auth";
import { isWolfCentralSlug } from "@/lib/wolf/wolf-surface";
import { buildWolfMission2ModelTestingArchPayload } from "@/lib/wolf/wolf-mission2-model-testing-arch-service";

export const dynamic = "force-dynamic";

function loadBenchmarkResults(): Record<string, unknown> | null {
  const candidates = [
    join(process.cwd(), "src/lib/wolf/mission2-benchmark-results.json"),
    join(process.cwd(), "../artifacts/mission2/mission2_benchmark_results.json"),
    join(process.cwd(), "../wolf_ai/../artifacts/mission2/mission2_benchmark_results.json"),
  ];
  for (const path of candidates) {
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    } catch {
      // try next candidate
    }
  }
  return null;
}

export async function GET() {
  const auth = await requireInterfaceWorxWorkspaceSession();
  if ("error" in auth) return auth.error;

  if (!isWolfCentralSlug(auth.workspace.slug)) {
    return NextResponse.json(
      { error: "Mission 2 MODEL TESTING ARCH is only available on WOLF Central." },
      { status: 403 },
    );
  }

  const benchmarkResults = loadBenchmarkResults();
  return NextResponse.json(buildWolfMission2ModelTestingArchPayload(benchmarkResults));
}
