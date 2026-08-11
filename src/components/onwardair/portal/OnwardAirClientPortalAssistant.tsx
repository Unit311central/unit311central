"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { PLATFORM_AI_ASSISTANT_VISIBLE } from "@/lib/product-surface-flags";
import { cn } from "@/lib/utils";

const ExecutiveAssistantPanel = dynamic(
  () => import("@/components/executive-assistant/ExecutiveAssistantPanel"),
  { ssr: false },
);

type Props = {
  companyName: string;
};

/** Read-only Executive Assistant for external OnwardAir client portals. */
export function OnwardAirClientPortalAssistant({ companyName }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  if (!PLATFORM_AI_ASSISTANT_VISIBLE) return null;

  return (
    <>
      <button
        type="button"
        data-ai-target="ai-assistant"
        aria-label="Open portal assistant"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-40",
          "inline-flex h-12 items-center gap-2 rounded-full border border-teal-400/35 bg-teal-500/15 px-4",
          "text-sm font-semibold text-teal-100 shadow-lg backdrop-blur-sm transition hover:bg-teal-500/25",
        )}
      >
        <Sparkles className="h-4 w-4" />
        Assistant
      </button>

      {mounted ? (
        <ExecutiveAssistantPanel
          variant="drawer"
          open={open}
          onClose={() => setOpen(false)}
          activeView="client-portal"
          mode="internal"
          roleView="staff"
          embedded
        />
      ) : null}

      {open ? (
        <span className="sr-only">{companyName} portal assistant</span>
      ) : null}
    </>
  );
}
