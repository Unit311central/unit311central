"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ABHI_MEMBERSHIP_FEE_GBP,
  buildMemberBillingRow,
  formatAbhiBillingDate,
  formatAbhiGbp,
} from "@/lib/abhi-billing";
import { CalendarClock, MessageCircle, Send, Sparkles, Users2, Wallet } from "lucide-react";

type Props = {
  companyId: string;
  companyName: string;
};

type UpcomingEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
};

const UPCOMING_EVENTS: UpcomingEvent[] = [
  { id: "evt-1", title: "ABHI Digital Health Conference 2026", date: "2026-09-16", location: "London, UK" },
  { id: "evt-2", title: "WHX Dubai 2027 — UK Pavilion", date: "2027-02-09", location: "Dubai World Trade Centre" },
  { id: "evt-3", title: "ABHI Member Group Meetings — Q4 briefing", date: "2026-10-08", location: "Virtual" },
];

function formatEventDate(iso: string) {
  const date = new Date(`${iso}T09:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
    date,
  );
}

function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C2185B]/30 bg-[#C2185B]/15 text-[#f4a6c4]">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {subtitle ? <p className="text-xs text-white/45">{subtitle}</p> : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AbhiMemberPortalDashboard({ companyId, companyName }: Props) {
  const billing = useMemo(() => buildMemberBillingRow({ id: companyId, companyName }), [
    companyId,
    companyName,
  ]);

  const [chatDraft, setChatDraft] = useState("");
  const [chat, setChat] = useState<{ from: "member" | "assistant"; text: string }[]>([
    {
      from: "assistant",
      text: `Hi, I'm the ABHI member assistant for ${companyName}. Ask me about your billing, upcoming events, or your Working Group — I'm a demo for now.`,
    },
  ]);

  function handleChatSubmit(event: FormEvent) {
    event.preventDefault();
    const text = chatDraft.trim();
    if (!text) return;
    setChat((current) => [
      ...current,
      { from: "member", text },
      {
        from: "assistant",
        text: "Thanks — a member of the ABHI team will follow up. (This AI chat window shows sample data only.)",
      },
    ]);
    setChatDraft("");
  }

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/15 bg-gradient-to-br from-[#C2185B]/[0.14] via-white/[0.04] to-[#880E4F]/[0.10] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f4a6c4]/80">
          Welcome back
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">{companyName}</h1>
        <p className="mt-1 text-sm text-white/55">
          Your ABHI membership dashboard — billing, events, Working Group updates, and member
          support in one place.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          icon={<Wallet className="h-5 w-5" />}
          title="Billing"
          subtitle={`Annual membership · ${formatAbhiGbp(ABHI_MEMBERSHIP_FEE_GBP)} / year`}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#0b1524]/50 px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                Last payment
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {formatAbhiBillingDate(billing.lastPaymentDate)} ·{" "}
                {formatAbhiGbp(billing.lastPaymentAmountGbp)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b1524]/50 px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                Next payment
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {formatAbhiBillingDate(billing.nextPaymentDate)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b1524]/50 px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                Amount due
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {formatAbhiGbp(billing.amountDueGbp)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b1524]/50 px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                Status
              </p>
              <p className="mt-1 text-sm font-semibold text-white">{billing.status}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={<CalendarClock className="h-5 w-5" />}
          title="Upcoming events"
          subtitle="ABHI events and pavilion programmes"
        >
          <ul className="space-y-2">
            {UPCOMING_EVENTS.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b1524]/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{event.title}</p>
                  <p className="mt-0.5 text-xs text-white/45">{event.location}</p>
                </div>
                <span className="shrink-0 rounded-full border border-[#C2185B]/30 bg-[#C2185B]/10 px-2.5 py-1 text-[11px] font-semibold text-[#f4a6c4]">
                  {formatEventDate(event.date)}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          icon={<Users2 className="h-5 w-5" />}
          title="Working group — next meeting"
          subtitle="Digital Health Working Group"
        >
          <div className="rounded-xl border border-white/10 bg-[#0b1524]/50 px-4 py-4">
            <p className="text-sm font-semibold text-white">Thursday 13 August, 14:00 BST</p>
            <p className="mt-1 text-sm text-white/60">Virtual — Microsoft Teams</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.1em] text-white/35">
              Agenda
            </p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-white/70">
              <li>NHS digital adoption pathways update</li>
              <li>WHX Dubai 2027 pavilion debrief</li>
              <li>Member spotlight — {companyName}</li>
            </ul>
          </div>
        </SectionCard>

        <SectionCard
          icon={<MessageCircle className="h-5 w-5" />}
          title="AI chat window"
          subtitle="Sample assistant · demo data only"
        >
          <div className="flex h-64 flex-col rounded-xl border border-white/10 bg-[#0b1524]/50">
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {chat.map((message, index) => (
                <div
                  key={index}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.from === "assistant"
                      ? "bg-[#C2185B]/15 text-white/85"
                      : "ml-auto bg-white/10 text-white"
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleChatSubmit} className="flex gap-2 border-t border-white/10 p-2">
              <input
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                placeholder="Ask the ABHI assistant…"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#C2185B]/50"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#C2185B] px-3 py-2 text-sm font-semibold text-white hover:bg-[#a3134c]"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            </form>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/35">
            <Sparkles className="h-3 w-3" />
            Demo assistant — replies are canned sample data.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
