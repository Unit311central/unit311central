"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  Bell,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  FileText,
  FolderKanban,
  Loader2,
  Pin,
  Sparkles,
  Wallet,
} from "lucide-react";

import ExecutiveAssistantPanel from "@/components/executive-assistant/ExecutiveAssistantPanel";
import { cn } from "@/lib/utils";

type ProactiveBundle = {
  brief?: {
    greeting?: string;
    narrative?: string;
    topPriorities?: string[];
    recommendedFirstMove?: string;
  } | null;
  health?: {
    label?: string;
    score?: number;
    summary?: string;
  } | null;
  notifications?: Array<{ id?: string; title?: string; body?: string; severity?: string }>;
  generatedAt?: string;
};

type ConversationListItem = {
  id: string;
  title: string;
  updatedAt: string;
};

const QUICK_PROMPTS = [
  "Summarise today's business",
  "Show risks",
  "Cashflow forecast",
  "Pipeline forecast",
  "Project health",
  "Board summary",
  "Grant deadlines",
  "Outstanding approvals",
] as const;

const SUGGESTED_ACTIONS = [
  { id: "approve", label: "Approve Proposal", detail: "ABC Medical MSA", prompt: "Help me review and approve the ABC Medical proposal." },
  { id: "board", label: "Generate Board Report", detail: "Q3 pack", prompt: "Generate a board summary for tomorrow's pack." },
  { id: "cash", label: "Review Cashflow", detail: "13-week view", prompt: "Show me the cashflow forecast and anything that needs attention." },
  { id: "fin", label: "Open Financials", detail: "AR / AP focus", prompt: "Brief me on financials — overdue invoices and payables." },
  { id: "risk", label: "Review Risks", detail: "Delivery + capacity", prompt: "What are the top business risks today?" },
  { id: "pipeline", label: "Show Sales Pipeline", detail: "Weekly movement", prompt: "Summarise the sales pipeline and this week's movement." },
  { id: "priorities", label: "Ask About Today's Priorities", detail: "Decision order", prompt: "What should I do next today, in priority order?" },
] as const;

const FALLBACK_PRIORITIES = [
  "Approve ABC Medical proposal",
  "Three invoices overdue",
  "Engineering capacity reaches 91% Tuesday",
  "Board pack required tomorrow",
];

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

/**
 * Flagship Executive Operating Centre — proactive briefing first, conversation second.
 */
export default function ExecutiveOperatingCentre() {
  const [seedPrompt, setSeedPrompt] = useState<string | null>(null);
  const [proactive, setProactive] = useState<ProactiveBundle | null>(null);
  const [proactiveLoading, setProactiveLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setProactiveLoading(true);
      try {
        const response = await fetch(
          "/api/executive-assistant/proactive?include=brief,health,insights,notifications&view=executive-assistant",
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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/executive-assistant/conversations", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { conversations?: ConversationListItem[] };
        if (!cancelled) setConversations(Array.isArray(data.conversations) ? data.conversations.slice(0, 8) : []);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sendPrompt = useCallback((text: string) => {
    setSeedPrompt(text);
  }, []);

  const greeting =
    proactive?.brief?.greeting ||
    `Good morning.`;
  const narrative =
    proactive?.brief?.narrative ||
    "I analysed all connected business systems.";
  const priorities =
    proactive?.brief?.topPriorities?.length
      ? proactive.brief.topPriorities
      : FALLBACK_PRIORITIES;
  const recommendation =
    proactive?.brief?.recommendedFirstMove ||
    "Review the ABC Medical proposal before 2pm.";
  const healthLabel = proactive?.health?.label || "Excellent";
  const healthScore = proactive?.health?.score;
  const notifications = proactive?.notifications?.slice(0, 4) ?? [];

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[36rem] w-full min-w-0 gap-3 xl:gap-4">
      {/* LEFT RAIL */}
      <aside className="hidden w-[15.5rem] shrink-0 flex-col gap-3 overflow-y-auto lg:flex xl:w-[16.5rem]">
        <section className={cardClass()}>
          <SectionLabel>Today&apos;s Brief</SectionLabel>
          <p className="text-[12px] leading-relaxed text-white/70">
            {proactiveLoading ? "Refreshing briefing…" : narrative}
          </p>
          <button
            type="button"
            onClick={() => sendPrompt("Summarise today's business and tell me what to do next.")}
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[color:var(--platform-accent,#60a5fa)] hover:underline"
          >
            Open full brief
            <ChevronRight className="h-3 w-3" />
          </button>
        </section>

        <section className={cardClass()}>
          <SectionLabel>Pinned Conversations</SectionLabel>
          <p className="flex items-center gap-2 text-[12px] text-white/55">
            <Pin className="h-3.5 w-3.5 text-white/35" />
            Board pack draft
          </p>
          <p className="mt-2 flex items-center gap-2 text-[12px] text-white/55">
            <Pin className="h-3.5 w-3.5 text-white/35" />
            Cash &amp; AR review
          </p>
        </section>

        <section className={cardClass("flex min-h-0 flex-1 flex-col")}>
          <SectionLabel>Recent Conversations</SectionLabel>
          {conversations.length === 0 ? (
            <p className="text-[11px] text-white/40">Saved chats will appear here.</p>
          ) : (
            <ul className="space-y-1.5">
              {conversations.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() =>
                      sendPrompt(`Continue from our conversation titled "${item.title}". What should I do next?`)
                    }
                    className="w-full rounded-lg px-2 py-1.5 text-left text-[12px] text-white/75 hover:bg-white/[0.04]"
                  >
                    <span className="block truncate">{item.title}</span>
                    <span className="text-[10px] text-white/35">
                      {new Date(item.updatedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={cardClass()}>
          <SectionLabel>Saved Reports</SectionLabel>
          <button
            type="button"
            onClick={() => sendPrompt("Open my latest saved board report and summarise decisions required.")}
            className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-[12px] text-white/70 hover:bg-white/[0.04]"
          >
            <FileText className="h-3.5 w-3.5 text-white/40" />
            Q3 Board Pack
          </button>
          <button
            type="button"
            onClick={() => sendPrompt("Summarise the latest cashflow report.")}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-[12px] text-white/70 hover:bg-white/[0.04]"
          >
            <Wallet className="h-3.5 w-3.5 text-white/40" />
            Cashflow forecast
          </button>
        </section>

        <section className={cardClass()}>
          <SectionLabel>Board Packs</SectionLabel>
          <button
            type="button"
            onClick={() => sendPrompt("Prepare tomorrow's board pack outline and list missing inputs.")}
            className="flex w-full items-center gap-2 text-left text-[12px] text-white/70 hover:text-white"
          >
            <BookOpen className="h-3.5 w-3.5 text-white/40" />
            Pack due tomorrow
          </button>
        </section>

        <section className={cardClass()}>
          <SectionLabel>Quick Prompts</SectionLabel>
          <div className="flex flex-col gap-1">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendPrompt(prompt)}
                className="rounded-lg px-2 py-1.5 text-left text-[11px] text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>
      </aside>

      {/* CENTRE */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5">
          {/* Executive Briefing hero */}
          <section
            className={cn(cardClass("p-5 sm:p-6"), "relative overflow-hidden")}
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--platform-accent, #2F80ED) 16%, var(--platform-card, #121C2D)), var(--platform-card, #121C2D))",
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles
                className="h-4 w-4"
                style={{ color: "var(--platform-accent, #2F80ED)" }}
                strokeWidth={1.6}
              />
              <p className="text-[11px] font-semibold tracking-[0.14em] text-white/50 uppercase">
                Executive Briefing
              </p>
              {proactiveLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white/35" /> : null}
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {greeting.includes("Philip") || greeting.length > 20
                ? greeting
                : `Good morning Philip.`}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
              {narrative.includes("analysed") || narrative.length > 40
                ? narrative
                : "I analysed all connected business systems."}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[10px] border border-white/10 bg-black/20 px-3 py-3">
                <p className="text-[10px] font-semibold tracking-wide text-white/40 uppercase">
                  Business Health
                </p>
                <p className="mt-1 text-lg font-semibold text-emerald-300">
                  {healthLabel}
                  {typeof healthScore === "number" ? (
                    <span className="ml-2 text-sm font-medium text-white/45">{healthScore}</span>
                  ) : null}
                </p>
              </div>
              <div className="rounded-[10px] border border-white/10 bg-black/20 px-3 py-3 sm:col-span-2">
                <p className="text-[10px] font-semibold tracking-wide text-white/40 uppercase">
                  AI Recommendation
                </p>
                <p className="mt-1 text-sm font-medium text-white/90">{recommendation}</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[10px] font-semibold tracking-wide text-white/40 uppercase">
                Today&apos;s Priorities
              </p>
              <ul className="mt-2 space-y-1.5">
                {priorities.slice(0, 5).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-white/80">
                    <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--platform-accent,#60a5fa)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Suggested Actions */}
          <section>
            <SectionLabel>Suggested Actions</SectionLabel>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {SUGGESTED_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => sendPrompt(action.prompt)}
                  className={cn(
                    cardClass("group p-3.5 text-left transition-colors"),
                    "hover:border-[color:var(--platform-accent,#2F80ED)]/40",
                  )}
                >
                  <p className="text-[13px] font-medium text-white group-hover:text-white">
                    {action.label}
                  </p>
                  <p className="mt-1 text-[11px] text-white/40">{action.detail}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Conversation — below briefing */}
          <section className="min-h-[22rem]">
            <SectionLabel>Conversation</SectionLabel>
            <div className="h-[min(28rem,50dvh)] min-h-[20rem] overflow-hidden rounded-[12px] border border-[color:var(--platform-card-border,#243347)]">
              <ExecutiveAssistantPanel
                variant="page"
                activeView="executive-assistant"
                mode="internal"
                hideSidebar
                embedded
                seedPrompt={seedPrompt}
                onSeedConsumed={() => setSeedPrompt(null)}
                className="min-h-full rounded-none border-0"
              />
            </div>
          </section>
        </div>
      </div>

      {/* RIGHT RAIL */}
      <aside className="hidden w-[15.5rem] shrink-0 flex-col gap-3 overflow-y-auto xl:flex xl:w-[16.5rem]">
        <section className={cardClass()}>
          <SectionLabel>Business Context</SectionLabel>
          <div className="space-y-2 text-[12px] text-white/70">
            <p className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-emerald-300/80" />
              Health: {healthLabel}
            </p>
            <p className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-white/40" />
              Operating across all workspaces
            </p>
          </div>
        </section>

        <section className={cardClass()}>
          <SectionLabel>Connected Systems</SectionLabel>
          <ul className="space-y-1.5 text-[12px] text-white/65">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300/70" /> Financials
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300/70" /> CRM / Pipeline
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300/70" /> Projects
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300/70" /> Support Desk
            </li>
          </ul>
        </section>

        <section className={cardClass()}>
          <SectionLabel>Running Tasks</SectionLabel>
          <p className="text-[12px] text-white/55">No background AI tasks running.</p>
        </section>

        <section className={cardClass()}>
          <SectionLabel>Notifications</SectionLabel>
          {notifications.length === 0 ? (
            <p className="text-[12px] text-white/45">No urgent notifications.</p>
          ) : (
            <ul className="space-y-2">
              {notifications.map((item, index) => (
                <li key={item.id ?? String(index)} className="flex gap-2 text-[12px] text-white/70">
                  <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-200/70" />
                  <span>{item.title || item.body || "Update"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={cardClass()}>
          <SectionLabel>AI Memory</SectionLabel>
          <p className="text-[12px] leading-relaxed text-white/55">
            Prefers concise briefs, decision-first recommendations, and board-ready language.
          </p>
        </section>

        <section className={cardClass()}>
          <SectionLabel>Upcoming Meetings</SectionLabel>
          <ul className="space-y-2 text-[12px] text-white/70">
            <li className="flex gap-2">
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" />
              <span>
                Leadership sync
                <span className="block text-[11px] text-white/35">Today · 10:30</span>
              </span>
            </li>
            <li className="flex gap-2">
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" />
              <span>
                ABC Medical proposal review
                <span className="block text-[11px] text-white/35">Today · 14:00</span>
              </span>
            </li>
          </ul>
        </section>

        <section className={cardClass()}>
          <SectionLabel>Recent Documents</SectionLabel>
          <button
            type="button"
            onClick={() => sendPrompt("Summarise recent documents that need my attention.")}
            className="flex w-full items-center gap-2 text-left text-[12px] text-white/65 hover:text-white"
          >
            <FolderKanban className="h-3.5 w-3.5 text-white/40" />
            Open document brief
          </button>
        </section>
      </aside>
    </div>
  );
}
