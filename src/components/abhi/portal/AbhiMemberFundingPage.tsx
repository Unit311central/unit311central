"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Sparkles,
} from "lucide-react";

import {
  ABHI_FUNDING_SOURCES,
  answerFundingQuestion,
  buildAbhiFundingDashboard,
  formatFundingGbp,
  type AbhiMatchedOpportunity,
} from "@/lib/abhi/member-funding-data";
import { formatMemberPortalDate } from "@/lib/abhi/member-portal-data";

type Props = {
  companyPath: string;
  companyId: string;
  companyName: string;
};

const SUGGESTED_QUESTIONS = [
  "What grants are most relevant to Abbott?",
  "Which grants require university partners?",
  "Which opportunities close in the next 60 days?",
  "Which grants support diagnostic innovation?",
  "Which grants support NHS deployment?",
];

export function AbhiMemberFundingPage({
  companyPath,
  companyId,
  companyName,
}: Props) {
  const dashboard = useMemo(
    () => buildAbhiFundingDashboard(companyId, companyName),
    [companyId, companyName],
  );
  const [selectedId, setSelectedId] = useState(dashboard.opportunities[0]?.id ?? "");
  const selected =
    dashboard.opportunities.find((o) => o.id === selectedId) ?? dashboard.opportunities[0];

  const [assistantDraft, setAssistantDraft] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<
    { from: "member" | "assistant"; text: string }[]
  >([
    {
      from: "assistant",
      text: `I'm the Funding Assistant for ${companyName}. Ask which grants match your profile, need university partners, close soon, support diagnostics, or NHS deployment.`,
    },
  ]);

  function ask(question: string) {
    const q = question.trim();
    if (!q) return;
    const answer = answerFundingQuestion(q, dashboard);
    setAssistantMessages((current) => [
      ...current,
      { from: "member", text: q },
      { from: "assistant", text: answer },
    ]);
    setAssistantDraft("");
  }

  function handleAssistantSubmit(event: FormEvent) {
    event.preventDefault();
    ask(assistantDraft);
  }

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/12 bg-gradient-to-br from-[#C2185B]/20 via-[#0d1b2e] to-transparent p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f4a6c4]/80">
          Growth & Funding
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Funding Opportunities</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Personalised matches for {companyName} — refreshed daily from Innovate UK, SBRI,
          NIHR, UKRI, Horizon Europe, Wellcome, and LifeArc.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Open Opportunities" value={String(dashboard.openCount)} />
          <Metric
            label="High Match Opportunities"
            value={String(dashboard.highMatchCount)}
            accent
          />
          <Metric
            label="Potential Funding Available"
            value={formatFundingGbp(dashboard.potentialFundingGbp)}
            accent
          />
          <Metric
            label="Closing Within 30 Days"
            value={String(dashboard.closingWithin30Days)}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a
            href={`/api/abhi/member-funding/brief?company=${encodeURIComponent(companyPath)}&format=pdf`}
            className="inline-flex items-center gap-2 rounded-lg border border-[#C2185B]/40 bg-[#C2185B]/20 px-3 py-2 text-xs font-semibold text-[#f4a6c4] hover:bg-[#C2185B]/30"
          >
            <FileText className="h-3.5 w-3.5" />
            Generate Funding Brief
          </a>
          <a
            href={`/api/abhi/member-funding/brief?company=${encodeURIComponent(companyPath)}&format=pdf`}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10"
          >
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </a>
          <a
            href={`/api/abhi/member-funding/brief?company=${encodeURIComponent(companyPath)}&format=docx`}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10"
          >
            <Download className="h-3.5 w-3.5" />
            Export Word
          </a>
          <span className="text-[11px] text-white/35">
            Connector refresh · {dashboard.refreshedAt}
          </span>
        </div>
      </header>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">Organisation profile (matching)</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <ProfileField label="Organisation" value={dashboard.profile.organisationName} />
          <ProfileField label="Country" value={dashboard.profile.country} />
          <ProfileField label="Organisation Type" value={dashboard.profile.organisationType} />
          <ProfileField label="Industry" value={dashboard.profile.industry} />
          <ProfileField label="Sector" value={dashboard.profile.sector} />
          <ProfileField
            label="University Collaboration"
            value={dashboard.profile.universityCollaboration ? "Yes" : "No"}
          />
          <ProfileField
            label="NHS Collaboration"
            value={dashboard.profile.nhsCollaboration ? "Yes" : "No"}
          />
          <ProfileField
            label="Capabilities"
            value={dashboard.profile.capabilities.join(" · ")}
          />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Matched opportunities</h2>
          {dashboard.opportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              selected={opp.id === selected?.id}
              onSelect={() => setSelectedId(opp.id)}
            />
          ))}
        </section>

        <div className="space-y-4">
          {selected ? <OpportunityDetail opportunity={selected} /> : null}

          <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#f4a6c4]" />
              <h2 className="text-sm font-semibold text-white">Ask Funding Assistant</h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  className="rounded-full border border-white/12 bg-black/20 px-2.5 py-1 text-[11px] text-white/70 hover:border-[#C2185B]/40 hover:text-white"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-3">
              {assistantMessages.map((msg, idx) => (
                <p
                  key={`${msg.from}-${idx}`}
                  className={
                    msg.from === "assistant"
                      ? "text-xs text-white/75"
                      : "text-xs font-medium text-[#f4a6c4]"
                  }
                >
                  {msg.from === "assistant" ? "Assistant: " : "You: "}
                  {msg.text}
                </p>
              ))}
            </div>
            <form onSubmit={handleAssistantSubmit} className="mt-3 flex gap-2">
              <input
                value={assistantDraft}
                onChange={(e) => setAssistantDraft(e.target.value)}
                placeholder="Ask about funding matches…"
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

          <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
            <h2 className="text-sm font-semibold text-white">Live data sources</h2>
            <ul className="mt-3 space-y-2">
              {ABHI_FUNDING_SOURCES.map((source) => (
                <li key={source.id}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-white/65 hover:text-[#f4a6c4]"
                  >
                    {source.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-xl border border-[#C2185B]/35 bg-[#C2185B]/15 px-4 py-3"
          : "rounded-xl border border-white/12 bg-black/25 px-4 py-3"
      }
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-0.5 text-white/85">{value}</p>
    </div>
  );
}

function OpportunityCard({
  opportunity,
  selected,
  onSelect,
}: {
  opportunity: AbhiMatchedOpportunity;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        selected
          ? "w-full rounded-xl border border-[#C2185B]/45 bg-[#C2185B]/10 p-4 text-left"
          : "w-full rounded-xl border border-white/12 bg-black/20 p-4 text-left hover:border-white/25"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{opportunity.programme}</p>
          <p className="text-xs text-white/45">{opportunity.awardingBody}</p>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
          Match {opportunity.matchScore}%
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/55">
        <span>{opportunity.fundingAmountLabel}</span>
        <span>Opens {formatMemberPortalDate(opportunity.opensOn)}</span>
        <span>Closes {formatMemberPortalDate(opportunity.closesOn)}</span>
        <span>{opportunity.status}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-white/65">{opportunity.challengeSummary}</p>
      <p className="mt-2 text-[11px] font-medium text-[#f4a6c4]">
        Why relevant: {opportunity.whyRelevant.join(" · ")}
      </p>
    </button>
  );
}

function OpportunityDetail({ opportunity }: { opportunity: AbhiMatchedOpportunity }) {
  return (
    <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
        Opportunity detail
      </p>
      <h3 className="mt-1 text-lg font-semibold text-white">{opportunity.programme}</h3>
      <dl className="mt-3 space-y-2 text-sm">
        <DetailRow label="Awarding Body" value={opportunity.awardingBody} />
        <DetailRow label="Funding" value={opportunity.fundingAmountLabel} />
        <DetailRow label="Status" value={opportunity.status} />
        <DetailRow label="Application Opens" value={formatMemberPortalDate(opportunity.opensOn)} />
        <DetailRow label="Application Closes" value={formatMemberPortalDate(opportunity.closesOn)} />
        <DetailRow label="Match Score" value={`${opportunity.matchScore}%`} />
      </dl>
      <p className="mt-3 text-sm text-white/70">{opportunity.challengeSummary}</p>
      <div className="mt-3">
        <p className="text-xs font-semibold text-white/50">Why Relevant</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-white/75">
          {opportunity.whyRelevant.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <a
        href={opportunity.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#f4a6c4] hover:underline"
      >
        View Details
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </section>
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
