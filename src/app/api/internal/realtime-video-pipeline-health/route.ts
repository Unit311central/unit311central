/**
 * Real-Time Video & AI Pipeline deploy health probe.
 * Ensures migration 193 tables exist and reference scenario is seeded (idempotent).
 */
import { NextResponse } from "next/server";

import { REFERENCE_SCENARIO_SLUG } from "@/lib/realtime-video-pipeline/constants";
import { REFERENCE_PIPELINE_STAGES } from "@/lib/realtime-video-pipeline/reference-scenario-seed";
import {
  ensureReferenceScenario,
  getScenarioWithStages,
} from "@/lib/realtime-video-pipeline/service";
import { isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        feature: "realtime-video-pipeline",
        ready: false,
        reason: "supabase-service-role-not-configured",
      },
      { status: 503 },
    );
  }

  try {
    const scenario = await ensureReferenceScenario();
    const loaded = await getScenarioWithStages(scenario.id);
    const enabledStages = loaded.stages.filter((stage) => stage.enabled);

    const rfPropagation = enabledStages.find((stage) => stage.component === "RF propagation");
    const checks = {
      referenceScenarioSlug: scenario.slug === REFERENCE_SCENARIO_SLUG,
      stageCount: loaded.stages.length,
      enabledStageCount: enabledStages.length,
      expectedMinimumStages: REFERENCE_PIPELINE_STAGES.length,
      rfPropagationMs: rfPropagation?.transmissionMs ?? null,
      rfPropagationCalculated: rfPropagation?.measurementStatus === "Calculated",
      completeLatencyTbd: loaded.summary.completeLatencyMs == null,
      knownMinimumMs: loaded.summary.knownMinimumMs,
    };

    const ready =
      checks.referenceScenarioSlug &&
      checks.stageCount >= REFERENCE_PIPELINE_STAGES.length &&
      checks.rfPropagationCalculated &&
      checks.completeLatencyTbd;

    return NextResponse.json(
      {
        ok: ready,
        feature: "realtime-video-pipeline",
        ready,
        scenario: {
          id: scenario.id,
          slug: scenario.slug,
          name: scenario.name,
        },
        summary: {
          stageCount: loaded.summary.stageCount,
          enabledStageCount: loaded.summary.enabledStageCount,
          completeLatencyMs: loaded.summary.completeLatencyMs,
          knownMinimumMs: loaded.summary.knownMinimumMs,
          rawVideoLatencyMs: loaded.summary.rawVideoLatencyMs,
          aiAnnotatedLatencyMs: loaded.summary.aiAnnotatedLatencyMs,
          tbdStages: loaded.summary.tbdStages,
          calculatedStages: loaded.summary.calculatedStages,
        },
        checks,
      },
      {
        status: ready ? 200 : 503,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        feature: "realtime-video-pipeline",
        ready: false,
        error: error instanceof Error ? error.message : "Health probe failed.",
      },
      { status: 503 },
    );
  }
}
