"use client";

import { useMemo, useState } from "react";

import { MotionStudioModalHost } from "@/components/motion-studio/MotionStudioModal";
import { MotionStudioPlayer } from "@/components/motion-studio/MotionStudioPlayer";
import { buildSalesOpportunitySpec } from "@/lib/motion-studio/templates/sales-opportunity";
import type { MotionStudioPreviewPayload } from "@/lib/motion-studio/types";

const SAMPLE_PROMPT =
  "Create a 30-second animated walkthrough explaining how Unit311Central manages a sales opportunity, from initial contact through deal closure.";

export default function MotionStudioLabClient() {
  const payload = useMemo((): MotionStudioPreviewPayload => {
    const spec = buildSalesOpportunitySpec({ promptEcho: SAMPLE_PROMPT });
    return { ...spec, id: "lab-sales-opportunity" };
  }, []);

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div
      className="min-h-dvh bg-[#050b16] px-4 py-6 text-white"
      data-testid="motion-studio-lab"
    >
      <header className="mx-auto mb-6 max-w-5xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/80">
          Development lab · Motion Studio
        </p>
        <h1 className="mt-1 font-display text-xl font-semibold">Playback verification</h1>
      </header>
      <div className="mx-auto max-w-5xl space-y-4">
        <button
          type="button"
          data-testid="motion-studio-lab-open-modal"
          className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
          onClick={() => setModalOpen(true)}
        >
          Open modal player
        </button>
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
          <MotionStudioPlayer payload={payload} autoPlay={false} variant="full" />
        </div>
      </div>
      <MotionStudioModalHost open={modalOpen} payload={payload} onClose={() => setModalOpen(false)} />
    </div>
  );
}
