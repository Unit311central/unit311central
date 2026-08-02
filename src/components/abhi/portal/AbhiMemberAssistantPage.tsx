"use client";

import { FormEvent, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import {
  answerFundingQuestion,
  buildAbhiFundingDashboard,
} from "@/lib/abhi/member-funding-data";
import { memberPortalHref } from "@/lib/abhi/member-portal-data";
import Link from "next/link";

type Props = {
  companyPath: string;
  companyId: string;
  companyName: string;
};

export function AbhiMemberAssistantPage({
  companyPath,
  companyId,
  companyName,
}: Props) {
  const funding = useMemo(
    () => buildAbhiFundingDashboard(companyId, companyName),
    [companyId, companyName],
  );
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<{ from: "member" | "assistant"; text: string }[]>([
    {
      from: "assistant",
      text: `Hi — I'm the ABHI Member Assistant for ${companyName}. Ask about membership, events, working groups, or funding opportunities.`,
    },
  ]);

  function respond(text: string) {
    const q = text.toLowerCase();
    if (/fund|grant|sbri|nihr|innovate|opportunity/.test(q)) {
      return answerFundingQuestion(text, funding);
    }
    if (/event|conference|register/.test(q)) {
      return `You have ${3} upcoming ABHI events. Open Events & Programmes to register — Digital Health Conference is next on the calendar.`;
    }
    if (/working group|digital health/.test(q)) {
      return "You're in the Digital Health Working Group. Next meeting is Thu 13 Aug · 14:00 BST.";
    }
    if (/renew|billing|invoice|membership/.test(q)) {
      return `${companyName} membership is Active. Next renewal is 24 Oct 2026. Open Membership Overview for billing detail.`;
    }
    return `I can help with funding matches, events, working groups, and membership for ${companyName}. Try asking about grants most relevant to your organisation.`;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      { from: "member", text },
      { from: "assistant", text: respond(text) },
    ]);
    setDraft("");
  }

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#f4a6c4]" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Support
            </p>
            <h1 className="text-2xl font-semibold text-white">Member Assistant</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-white/55">
          Ask about membership, events, or funding. For deeper grant matching, use{" "}
          <Link
            href={memberPortalHref(companyPath, "/funding")}
            className="font-semibold text-[#f4a6c4] hover:underline"
          >
            Funding & Opportunities
          </Link>
          .
        </p>
      </header>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
        <div className="max-h-[28rem] space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-4">
          {messages.map((msg, idx) => (
            <div
              key={`${msg.from}-${idx}`}
              className={
                msg.from === "assistant"
                  ? "rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80"
                  : "ml-8 rounded-xl border border-[#C2185B]/30 bg-[#C2185B]/15 px-3 py-2 text-sm text-[#f4a6c4]"
              }
            >
              {msg.text}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask the member assistant…"
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#C2185B]/50 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#C2185B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#ad1551]"
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
