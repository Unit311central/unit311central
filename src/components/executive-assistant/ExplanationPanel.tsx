"use client";

import { useState } from "react";

import type { AiExplanation } from "@/lib/ai-operating-assistant/explainability";
import { formatConfidence } from "@/lib/ai-operating-assistant/explainability";
import { handleExecutiveActionHref } from "@/lib/ai-operating-assistant/proactive-client";
import { cn } from "@/lib/utils";
import { ChevronDown, ExternalLink, ShieldCheck } from "lucide-react";

import AssistantFeedbackButtons from "./AssistantFeedbackButtons";

export default function ExplanationPanel({
  title,
  explanation,
  feedbackTargetId,
  feedbackTargetType = "insight",
  contextView,
  compact = false,
  className,
}: {
  title?: string;
  explanation: AiExplanation;
  feedbackTargetId: string;
  feedbackTargetType?: "insight" | "brief" | "health" | "message" | "recommendation" | "other";
  contextView?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(!compact);

  return (
    <div className={cn("rounded-xl border border-white/10 bg-white/[0.03]", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-white/80">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
          {title ?? "Why this recommendation"}
          <span className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-100">
            Confidence {formatConfidence(explanation.confidence)}
          </span>
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-white/45 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="space-y-3 border-t border-white/10 px-3 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Reasoning summary
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/75">
              {explanation.reasoningSummary}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Evidence
            </p>
            <ul className="mt-1 space-y-1">
              {explanation.evidence.map((item, index) => (
                <li key={`${item.label}-${index}`} className="text-xs text-white/70">
                  · {item.label}
                  {item.detail ? (
                    <span className="text-white/45"> — {item.detail}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Data sources
            </p>
            <p className="mt-1 text-[11px] text-white/55">{explanation.dataSources.join(" · ")}</p>
          </div>

          {explanation.assumptions.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                Assumptions / data gaps
              </p>
              <ul className="mt-1 space-y-1">
                {explanation.assumptions.map((item) => (
                  <li key={item} className="text-[11px] text-amber-100/80">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {explanation.recommendedActions.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                Recommended actions
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {explanation.recommendedActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      if (action.href) handleExecutiveActionHref(action.href);
                    }}
                    className="rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-[10px] font-medium text-sky-100"
                  >
                    {action.label}
                    {action.requiresConfirmation ? " · confirm" : ""}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-white/40">
                AI recommends — you decide. Writes never run without explicit confirmation.
              </p>
            </div>
          ) : null}

          {explanation.drillDown ? (
            <button
              type="button"
              onClick={() => handleExecutiveActionHref(explanation.drillDown!.href)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-200 hover:text-sky-100"
            >
              <ExternalLink className="h-3 w-3" />
              {explanation.drillDown.label}
            </button>
          ) : null}

          <AssistantFeedbackButtons
            targetId={feedbackTargetId}
            targetType={feedbackTargetType}
            contextView={contextView}
          />
        </div>
      ) : null}
    </div>
  );
}
