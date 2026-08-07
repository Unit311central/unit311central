"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronRight, Loader2, Pin, Zap } from "lucide-react";

import ExecutiveAssistantPanel from "@/components/executive-assistant/ExecutiveAssistantPanel";
import { useOperatorEntitlements } from "@/components/testflighthub/OperatorEntitlementsProvider";
import type { AssistantFollowUpAction } from "@/lib/ai-operating-assistant/tool-result";
import { isBrowserCorpCentreSurface } from "@/lib/corpcentre-surface";
import { isBrowserTalantonImpactSurface } from "@/lib/talanton-surface";
import { cn } from "@/lib/utils";

type ProactiveBundle = {
  brief?: {
    greeting?: string;
    headline?: string;
    narrative?: string;
    priorities?: string[];
    followUpActions?: AssistantFollowUpAction[];
  } | null;
};

const QUICK_PROMPTS = [
  "Chase overdue invoices",
  "Log an expense of €85 for client lunch",
  "Schedule a follow-up meeting tomorrow at 10am",
  "Review today's priorities",
  "Summarise cash and AR",
  "What changed overnight?",
] as const;

const CORPCENTRE_QUICK_PROMPTS = [
  "Chase overdue invoices",
  "Log an expense of AU$85 for client lunch",
  "Schedule a follow-up meeting tomorrow at 10am",
  "Review today's priorities",
  "Explain cash position in AUD",
  "What needs attention today?",
] as const;

const TALANTON_QUICK_PROMPTS = [
  "Give me an executive briefing",
  "What requires attention across the portfolio?",
  "Summarise fund capital deployment",
  "Summarise portfolio impact metrics",
  "What board actions are overdue?",
  "Create Board Pack",
] as const;

const PINNED_CONVERSATIONS = [
  {
    id: "ar",
    title: "AR chase queue",
    prompt: "Show overdue invoices and chase the highest-priority one.",
  },
  {
    id: "cash",
    title: "Cash & expenses",
    prompt: "Review recent expenses and help me log any outstanding claims.",
  },
] as const;

function cardClass(className?: string) {
  return cn(
    "rounded-[12px] border p-3.5",
    "border-[color:var(--platform-card-border,#243347)] bg-[color:var(--platform-card,#121C2D)]",
    className,
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-white/40 uppercase">
      {children}
    </p>
  );
}

function resolveGreeting(raw?: string | null) {
  const hour = new Date().getHours();
  const fallback =
    hour < 12 ? "Good morning." : hour < 18 ? "Good afternoon." : "Good evening.";
  const trimmed = raw?.trim();
  if (!trimmed) return fallback;
  const match = trimmed.match(/good\s+(morning|afternoon|evening)/i);
  if (!match) return fallback;
  const period = match[1].toLowerCase();
  return `Good ${period}.`;
}

function promptForAction(action: AssistantFollowUpAction): string {
  if (action.actionId === "finance.chaseOverdueInvoice") {
    const invoiceNumber =
      typeof action.input?.invoiceNumber === "string" ? action.input.invoiceNumber : null;
    const clientName =
      typeof action.input?.clientName === "string" ? action.input.clientName : null;
    if (invoiceNumber) return `Chase overdue invoice ${invoiceNumber}`;
    if (clientName) return `Chase the overdue invoice for ${clientName}`;
    return "Chase the highest-priority overdue invoice";
  }
  if (action.actionId === "finance.createExpense") {
    return "Log an expense — ask me for amount and purpose if needed";
  }
  if (action.actionId === "calendar.scheduleMeeting") {
    const clientName =
      typeof action.input?.clientName === "string" ? action.input.clientName : null;
    return clientName
      ? `Schedule a follow-up meeting with ${clientName} next Tuesday at 10am`
      : "Schedule a follow-up meeting next Tuesday at 10am";
  }
  return action.label;
}

/**
 * Conversation-first Executive Assistant — calm workspace for decisions, not a second dashboard.
 */
export default function ExecutiveOperatingCentre() {
  const [seedPrompt, setSeedPrompt] = useState<string | null>(null);
  const [seedAction, setSeedAction] = useState<AssistantFollowUpAction | null>(null);
  const [proactive, setProactive] = useState<ProactiveBundle | null>(null);
  const [proactiveLoading, setProactiveLoading] = useState(true);
  const { roleView } = useOperatorEntitlements();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setProactiveLoading(true);
      try {
        const response = await fetch(
          "/api/executive-assistant/proactive?include=brief&view=executive-assistant",
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("proactive failed");
        const data = (await response.json()) as ProactiveBundle;
        if (!cancelled) setProactive(data);
      } catch {
        if (!cancelled) setProactive(null);
      } finally {
        if (!cancelled) setProactiveLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sendPrompt = useCallback((text: string) => {
    setSeedAction(null);
    setSeedPrompt(text);
  }, []);

  const runDoIt = useCallback((action: AssistantFollowUpAction) => {
    if (action.kind === "confirm_action" && action.actionId) {
      setSeedPrompt(null);
      setSeedAction(action);
      return;
    }
    setSeedAction(null);
    setSeedPrompt(promptForAction(action));
  }, []);

  const greeting = resolveGreeting(proactive?.brief?.greeting);
  const narrative =
    proactive?.brief?.narrative ||
    proactive?.brief?.headline ||
    "A short brief of what matters today is ready when you need it.";
  const doItCards = (proactive?.brief?.followUpActions ?? []).slice(0, 4);

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[36rem] w-full min-w-0 gap-3 xl:gap-4">
      <aside className="hidden w-[15.5rem] shrink-0 flex-col gap-3 overflow-y-auto lg:flex xl:w-[16.5rem]">
        <section className={cardClass()}>
          <SectionLabel>Today&apos;s Brief</SectionLabel>
          <p className="text-[12px] leading-relaxed text-white/70">
            {proactiveLoading ? "Refreshing briefing…" : narrative}
          </p>
          <button
            type="button"
            onClick={() =>
              sendPrompt("Summarise today's business and tell me what to do next.")
            }
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[color:var(--platform-accent,#60a5fa)] hover:underline"
          >
            Discuss this brief
            <ChevronRight className="h-3 w-3" />
          </button>
        </section>

        <section className={cardClass()}>
          <SectionLabel>Do it</SectionLabel>
          {proactiveLoading ? (
            <p className="text-[12px] text-white/45">Loading actions…</p>
          ) : doItCards.length === 0 ? (
            <p className="text-[12px] text-white/45">No actions queued.</p>
          ) : (
            <ul className="space-y-1.5">
              {doItCards.map((action) => (
                <li key={action.id}>
                  <button
                    type="button"
                    onClick={() => runDoIt(action)}
                    className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left text-[12px] text-white/75 transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    <Zap className="h-3.5 w-3.5 shrink-0 text-[color:var(--platform-accent,#60a5fa)]" />
                    <span className="truncate">{action.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={cardClass()}>
          <SectionLabel>Pinned Conversations</SectionLabel>
          <ul className="space-y-1.5">
            {PINNED_CONVERSATIONS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => sendPrompt(item.prompt)}
                  className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left text-[12px] text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  <Pin className="h-3.5 w-3.5 shrink-0 text-white/35" />
                  <span className="truncate">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={cardClass("flex min-h-0 flex-1 flex-col")}>
          <SectionLabel>Quick Prompts</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {(typeof window !== "undefined" && isBrowserCorpCentreSurface()
              ? CORPCENTRE_QUICK_PROMPTS
              : typeof window !== "undefined" && isBrowserTalantonImpactSurface()
                ? TALANTON_QUICK_PROMPTS
                : QUICK_PROMPTS
            ).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendPrompt(prompt)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-medium leading-snug transition-colors",
                  "border-white/12 bg-white/[0.04] text-white/75",
                  "hover:border-[color:var(--platform-accent,#2F80ED)]/45 hover:bg-[color:var(--platform-accent,#2F80ED)]/12 hover:text-white",
                  "active:scale-[0.98]",
                )}
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="mb-1.5 shrink-0 px-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
              {greeting}
            </h2>
            {proactiveLoading ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-white/35" />
            ) : null}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-[color:var(--platform-card-border,#243347)]">
          <ExecutiveAssistantPanel
            variant="page"
            activeView="executive-assistant"
            mode="internal"
            roleView={roleView}
            hideSidebar
            embedded
            seedPrompt={seedPrompt}
            seedAction={seedAction}
            onSeedConsumed={() => {
              setSeedPrompt(null);
              setSeedAction(null);
            }}
            className="h-full min-h-0 rounded-none border-0"
          />
        </div>
      </div>
    </div>
  );
}
