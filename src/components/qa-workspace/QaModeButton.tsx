"use client";

import { useQaWorkspace } from "@/components/qa-workspace/QaWorkspaceProvider";
import { cn } from "@/lib/utils";

export default function QaModeButton() {
  const { enabled, betaMode, qaMode, setQaMode } = useQaWorkspace();
  if (!enabled || betaMode) return null;

  return (
    <button
      type="button"
      data-qa-target="qa-mode-toggle"
      aria-pressed={qaMode}
      onClick={() => setQaMode(!qaMode)}
      className={cn(
        "inline-flex h-9 items-center rounded-xl border px-3 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
        qaMode
          ? "border-rose-400/50 bg-rose-500/20 text-rose-100"
          : "border-white/15 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]",
      )}
    >
      QA Mode
    </button>
  );
}
