"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  FileDown,
  HeartPulse,
  Sparkles,
  TrendingUp,
  Users,
  AlertTriangle,
  PoundSterling,
} from "lucide-react";

import type { ManagedClient } from "@/lib/client-management-data";
import {
  MEMBER_INTEL_FILTERS,
  answerMemberIntelligenceQuestion,
  buildMemberIntelligencePortfolio,
  filterMemberIntelligenceRows,
  formatMemberIntelDate,
  formatMemberIntelGbp,
  getMemberIntelligenceDetail,
  type AbhiMemberIntelFilter,
  type AbhiMemberIntelligenceDetail,
  type AbhiPortfolioAiIntelligence,
  type AbhiRenewalRisk,
} from "@/lib/abhi/member-intelligence";
import { downloadAbhiRelationshipBriefPdf } from "@/lib/abhi/relationship-brief-pdf";
import { cn } from "@/lib/utils";

type Props = {
  clients: ManagedClient[];
};

const AI_SUGGESTIONS = [
  "Summarise our relationship with this member.",
  "Is this member at risk of non-renewal?",
  "What should we discuss at our next meeting?",
  "What opportunities are relevant?",
  "What events should they attend?",
  "What actions should the account manager take?",
];

export default function MemberIntelligenceWorkspace({ clients }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberId = searchParams.get("memberId")?.trim() || "";

  const portfolio = useMemo(
    () => buildMemberIntelligencePortfolio(clients),
    [clients],
  );
  const [filter, setFilter] = useState<AbhiMemberIntelFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let rows = filterMemberIntelligenceRows(portfolio.rows, filter);
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.memberName.toLowerCase().includes(q) ||
          r.accountManager.toLowerCase().includes(q) ||
          r.membershipType.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [portfolio.rows, filter, query]);

  const detail = useMemo(
    () => (memberId ? getMemberIntelligenceDetail(memberId, clients) : null),
    [memberId, clients],
  );

  function openMember(id: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("view", "member-intelligence");
    url.searchParams.set("memberId", id);
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  function backToPortfolio() {
    const url = new URL(window.location.href);
    url.searchParams.set("view", "member-intelligence");
    url.searchParams.delete("memberId");
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  if (memberId) {
    if (!detail) {
      return (
        <div className="space-y-4 p-1">
          <button
            type="button"
            onClick={backToPortfolio}
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to portfolio
          </button>
          <p className="text-sm text-white/50">Member not found.</p>
        </div>
      );
    }
    return <MemberDetail detail={detail} onBack={backToPortfolio} />;
  }

  const { summary, aiIntelligence } = portfolio;

  return (
    <div className="space-y-5 p-1">
      <header className="rounded-2xl border border-white/12 bg-gradient-to-br from-[#C2185B]/15 via-white/[0.03] to-transparent p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f4a6c4]/80">
          Members · Relationship Intelligence
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Member Intelligence</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Portfolio health, renewal risk, engagement, and relationship status — so staff can
          intervene before value is lost.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SummaryTile icon={<Users className="h-4 w-4" />} label="Total Members" value={String(summary.totalMembers)} />
          <SummaryTile
            icon={<HeartPulse className="h-4 w-4" />}
            label="Healthy Members"
            value={String(summary.healthyMembers)}
            tone="good"
          />
          <SummaryTile
            icon={<AlertTriangle className="h-4 w-4" />}
            label="At Risk Members"
            value={String(summary.atRiskMembers)}
            tone="risk"
          />
          <SummaryTile
            icon={<TrendingUp className="h-4 w-4" />}
            label="Renewals Due In 90 Days"
            value={String(summary.renewalsDueIn90Days)}
          />
          <SummaryTile
            icon={<PoundSterling className="h-4 w-4" />}
            label="Total Membership Revenue"
            value={formatMemberIntelGbp(summary.totalMembershipRevenueGbp)}
          />
          <SummaryTile
            icon={<Brain className="h-4 w-4" />}
            label="Average Engagement"
            value={String(summary.averageEngagementScore)}
            tone="accent"
          />
        </div>
      </header>

      <AiRelationshipIntelligencePanel
        intelligence={aiIntelligence}
        onOpenMember={openMember}
      />

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {MEMBER_INTEL_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                  filter === item.id
                    ? "border-[#C2185B]/50 bg-[#C2185B]/20 text-[#f4a6c4]"
                    : "border-white/12 bg-black/20 text-white/60 hover:border-white/25 hover:text-white",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members or account managers…"
            className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#C2185B]/50 focus:outline-none lg:w-72"
          />
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="bg-black/30 text-[10px] uppercase tracking-[0.12em] text-white/40">
              <tr>
                <Th>Member Name</Th>
                <Th>Membership Type</Th>
                <Th>Member Since</Th>
                <Th>Revenue To Date</Th>
                <Th>Renewal Date</Th>
                <Th>Events</Th>
                <Th>Working Groups</Th>
                <Th>Training</Th>
                <Th>Engagement</Th>
                <Th>Renewal Risk</Th>
                <Th>Relationship</Th>
                <Th>Account Manager</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => openMember(row.id)}
                  className="cursor-pointer border-t border-white/8 bg-white/[0.02] transition hover:bg-[#C2185B]/10"
                >
                  <td className="px-3 py-2.5 font-medium text-white">{row.memberName}</td>
                  <td className="px-3 py-2.5 text-white/70">{row.membershipType}</td>
                  <td className="px-3 py-2.5 text-white/70">{row.memberSinceYear}</td>
                  <td className="px-3 py-2.5 text-white/70">
                    {formatMemberIntelGbp(row.revenueToDateGbp)}
                  </td>
                  <td className="px-3 py-2.5 text-white/70">
                    {formatMemberIntelDate(row.renewalDate)}
                  </td>
                  <td className="px-3 py-2.5 text-white/70">{row.eventsAttended}</td>
                  <td className="px-3 py-2.5 text-white/70">{row.workingGroupsJoined}</td>
                  <td className="px-3 py-2.5 text-white/70">{row.trainingCompleted}</td>
                  <td className="px-3 py-2.5">
                    <ScorePill score={row.engagementScore} />
                  </td>
                  <td className="px-3 py-2.5">
                    <RiskBadge risk={row.renewalRisk} />
                  </td>
                  <td className="px-3 py-2.5 text-white/70">{row.relationshipStatus}</td>
                  <td className="px-3 py-2.5 text-white/70">{row.accountManager}</td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-3 py-8 text-center text-white/40">
                    No members match this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-white/35">
          Showing {filtered.length} of {portfolio.rows.length} members · click a row for member
          detail
        </p>
      </section>
    </div>
  );
}

function MemberDetail({
  detail,
  onBack,
}: {
  detail: AbhiMemberIntelligenceDetail;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<{ from: "user" | "ai"; text: string }[]>([
    {
      from: "ai",
      text: `Ask me about ${detail.memberName} — relationship, renewal risk, meeting agenda, opportunities, events, or account-manager actions.`,
    },
  ]);

  useEffect(() => {
    setMessages([
      {
        from: "ai",
        text: `Ask me about ${detail.memberName} — relationship, renewal risk, meeting agenda, opportunities, events, or account-manager actions.`,
      },
    ]);
    setDraft("");
  }, [detail.id, detail.memberName]);

  function ask(question: string) {
    const q = question.trim();
    if (!q) return;
    const answer = answerMemberIntelligenceQuestion(q, detail);
    setMessages((current) => [
      ...current,
      { from: "user", text: q },
      { from: "ai", text: answer },
    ]);
    setDraft("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    ask(draft);
  }

  return (
    <div className="space-y-5 p-1">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to portfolio
      </button>

      <header className="rounded-2xl border border-white/12 bg-gradient-to-br from-[#C2185B]/18 via-[#0d1b2e] to-transparent p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f4a6c4]/80">
          Member Detail
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
          {detail.memberName}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Chip>{detail.membershipType}</Chip>
          <Chip>Status: {detail.membershipStatus}</Chip>
          <Chip>Health: {detail.healthScore} · {detail.healthBand}</Chip>
          <RiskBadge risk={detail.renewalRisk} />
          <Chip>{detail.relationshipStatus}</Chip>
          <button
            type="button"
            onClick={() => downloadAbhiRelationshipBriefPdf(detail)}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-[#C2185B]/40 bg-[#C2185B]/20 px-3 py-1.5 text-xs font-semibold text-[#f4a6c4] hover:bg-[#C2185B]/30"
          >
            <FileDown className="h-3.5 w-3.5" />
            Generate Relationship Brief
          </button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold text-white">Member overview</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <DetailRow label="Membership Type" value={detail.membershipType} />
            <DetailRow label="Member Since" value={formatMemberIntelDate(detail.memberSince)} />
            <DetailRow label="Renewal Date" value={formatMemberIntelDate(detail.renewalDate)} />
            <DetailRow label="Revenue To Date" value={formatMemberIntelGbp(detail.revenueToDateGbp)} />
            <DetailRow label="Primary Contact" value={detail.primaryContact} />
            <DetailRow label="Account Manager" value={detail.accountManager} />
            <DetailRow label="Membership Status" value={detail.membershipStatus} />
          </dl>
        </section>

        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold text-white">Engagement</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <DetailRow label="Events Attended" value={String(detail.eventsAttended)} />
            <DetailRow label="Working Groups Joined" value={String(detail.workingGroupsJoined)} />
            <DetailRow label="Training Completed" value={String(detail.trainingCompleted)} />
            <DetailRow label="Portal Activity" value={`${detail.portalUsageScore}/100`} />
            <DetailRow label="Support Requests" value={String(detail.supportInteractions)} />
            <DetailRow label="Engagement Score" value={`${detail.engagementScore}/100`} />
            <DetailRow label="Renewal Risk" value={detail.renewalRisk} />
          </dl>
        </section>
      </div>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold text-white">Relationship summary</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/75">
          {detail.insights.relationshipSummary}
        </p>
        <p className="mt-3 rounded-xl border border-[#C2185B]/25 bg-[#C2185B]/10 px-3 py-2.5 text-sm text-[#f4a6c4]">
          <span className="font-semibold">Recommended next action: </span>
          {detail.insights.recommendedNextAction}
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold text-white">Member health assessment</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <DetailRow label="Health Score" value={String(detail.insights.health.healthScore)} />
            <DetailRow label="Trend" value={detail.insights.health.trend} />
            <DetailRow label="Risk Level" value={detail.insights.health.riskLevel} />
          </dl>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Reasoning
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-white/75">
            {detail.insights.health.reasoning.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold text-white">Renewal assessment</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <DetailRow
              label="Renewal Probability"
              value={`${detail.insights.renewal.renewalProbability}%`}
            />
            <DetailRow label="Confidence" value={detail.insights.renewal.confidence} />
          </dl>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Key drivers
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-white/75">
            {detail.insights.renewal.drivers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-white/60">{detail.insights.renewal.summary}</p>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold text-white">Recommended actions</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-white/75">
            {detail.insights.recommendedActions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
        </section>
        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold text-white">Next best actions</h2>
          <p className="mt-1 text-xs text-white/40">
            Immediate actions for {detail.accountManager}
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-white/75">
            {detail.insights.nextBestActions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => downloadAbhiRelationshipBriefPdf(detail)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10"
          >
            <FileDown className="h-3.5 w-3.5" />
            Download PDF
          </button>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold text-white">Relationship timeline</h2>
          <ol className="mt-4 space-y-3">
            {detail.timeline.map((event) => (
              <li
                key={event.id}
                className="relative border-l border-white/15 pl-4"
              >
                <span className="absolute -left-1 top-1.5 h-2 w-2 rounded-full bg-[#C2185B]" />
                <p className="text-[11px] font-semibold text-[#f4a6c4]">
                  {formatMemberIntelDate(event.date)} · {event.title}
                </p>
                <p className="text-sm text-white/70">{event.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#f4a6c4]" />
            <h2 className="text-sm font-semibold text-white">Ask AI About This Member</h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {AI_SUGGESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q.replace("this member", detail.memberName).replace("they", detail.memberName))}
                className="rounded-full border border-white/12 bg-black/20 px-2.5 py-1 text-[11px] text-white/65 hover:border-[#C2185B]/40 hover:text-white"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-3">
            {messages.map((msg, idx) => (
              <p
                key={`${msg.from}-${idx}`}
                className={
                  msg.from === "ai" ? "text-xs text-white/75" : "text-xs font-medium text-[#f4a6c4]"
                }
              >
                {msg.from === "ai" ? "AI: " : "You: "}
                {msg.text}
              </p>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Ask about ${detail.memberName}…`}
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#C2185B]/50 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#C2185B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#ad1551]"
            >
              Ask
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-2xl border border-dashed border-[#C2185B]/30 bg-[#C2185B]/5 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f4a6c4]/80">
          Funding & Opportunities · reserved integration
        </p>
        <h2 className="mt-1 text-sm font-semibold text-white">Funding Opportunities</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <SummaryTile label="Funding Opportunities" value={String(detail.funding.fundingOpportunities)} />
          <SummaryTile
            label="High Match Opportunities"
            value={String(detail.funding.highMatchOpportunities)}
            tone="accent"
          />
          <SummaryTile
            label="Potential Funding Value"
            value={detail.funding.potentialFundingLabel}
            tone="good"
          />
        </div>
        <p className="mt-3 text-xs text-white/45">
          Connected to the member Funding & Opportunities matching model — deepen this panel in a
          later integration pass.
        </p>
      </section>
    </div>
  );
}

function AiRelationshipIntelligencePanel({
  intelligence,
  onOpenMember,
}: {
  intelligence: AbhiPortfolioAiIntelligence;
  onOpenMember: (id: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-[#C2185B]/25 bg-gradient-to-br from-[#C2185B]/12 via-white/[0.03] to-transparent p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#f4a6c4]" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f4a6c4]/80">
            Action centre
          </p>
          <h2 className="text-lg font-semibold text-white">AI Relationship Intelligence</h2>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          label="Members Requiring Attention"
          value={String(intelligence.membersRequiringAttention)}
          tone="risk"
        />
        <SummaryTile
          label="High Value Members At Risk"
          value={String(intelligence.highValueAtRisk)}
          tone="accent"
        />
        <SummaryTile
          label="Renewals Due In 90 Days"
          value={String(intelligence.renewalsDueIn90Days)}
        />
        <SummaryTile
          label="Low Engagement Members"
          value={String(intelligence.lowEngagementMembers)}
        />
      </div>

      <p className="mt-4 text-sm font-medium text-white/85">
        {intelligence.membersRequiringAttention} members require attention.
      </p>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Priority actions
          </p>
          <ol className="mt-3 space-y-3">
            {intelligence.priorityActions.map((item, index) => (
              <li key={item.memberId}>
                <button
                  type="button"
                  onClick={() => onOpenMember(item.memberId)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-[#C2185B]/40 hover:bg-[#C2185B]/10"
                >
                  <p className="text-sm font-semibold text-white">
                    {index + 1}. {item.memberName}
                  </p>
                  <ul className="mt-1 space-y-0.5 text-xs text-white/60">
                    {item.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </button>
              </li>
            ))}
            {intelligence.priorityActions.length === 0 ? (
              <li className="text-sm text-white/45">No urgent priority accounts right now.</li>
            ) : null}
          </ol>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Recommended account manager actions
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-white/75">
              {intelligence.recommendedAccountManagerActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Relationship intervention recommendations
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-white/75">
              {intelligence.interventionRecommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "good" | "risk" | "accent";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3",
        tone === "good" && "border-emerald-400/25 bg-emerald-500/10",
        tone === "risk" && "border-amber-400/30 bg-amber-500/10",
        tone === "accent" && "border-[#C2185B]/35 bg-[#C2185B]/12",
        !tone && "border-white/12 bg-black/25",
      )}
    >
      <div className="flex items-center gap-1.5 text-white/45">
        {icon}
        <p className="text-[10px] font-medium uppercase tracking-[0.1em]">{label}</p>
      </div>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2.5 font-semibold">{children}</th>;
}

function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 80 ? "text-emerald-200 bg-emerald-500/15" : score >= 55 ? "text-amber-100 bg-amber-500/15" : "text-rose-200 bg-rose-500/15";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", tone)}>
      {score}
    </span>
  );
}

function RiskBadge({ risk }: { risk: AbhiRenewalRisk }) {
  const tone =
    risk === "Low"
      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
      : risk === "Medium"
        ? "border-amber-400/30 bg-amber-500/15 text-amber-100"
        : "border-rose-400/30 bg-rose-500/15 text-rose-100";
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", tone)}>
      {risk}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/75">
      {children}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/8 pb-1.5">
      <dt className="text-white/40">{label}</dt>
      <dd className="text-right text-white/85">{value}</dd>
    </div>
  );
}
