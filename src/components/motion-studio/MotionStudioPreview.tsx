"use client";

import type { MotionStudioPreviewPayload } from "@/lib/motion-studio/types";

import { MotionStudioPlayer } from "./MotionStudioPlayer";

type Props = {
  payload: MotionStudioPreviewPayload;
};

/** Compact inline summary — primary playback lives in {@link MotionStudioModal}. */
export function MotionStudioPreview({ payload }: Props) {
  return (
    <div className="mt-3 rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 p-4 shadow-lg">
      <MotionStudioPlayer payload={payload} variant="compact" dataTestId="motion-studio-preview-inline" />
    </div>
  );
}
