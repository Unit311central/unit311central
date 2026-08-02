"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, FileDown, Landmark, Sparkles } from "lucide-react";

import type { ManagedClient } from "@/lib/client-management-data";
import {
  answerRegulatoryQuestion,
  buildAbhiRegulatoryDashboard,
  formatRegulatoryDate,
  type AbhiRegulatoryExportKind,
  type AbhiRegulatoryImpactAssessment,
  type AbhiRegulatoryUpdate,
} from "@/lib/abhi/regulatory-intelligence";
import { downloadAbhiRegulatoryPdf } from "@/lib/abhi/regulatory-brief-pdf";
import { cn } from "@/lib/utils";

export type RegulatoryIntelligenceView =
  | "regulatory-dashboard"
  | "regulatory-updates"
  | "regulatory-impact"
  | "regulatory-alerts";

type Props = {
  clients: ManagedClient[];
  view: RegulatoryIntelligenceView;
};

const AI_QUESTIONS = [
  "What regulatory changes affect diagnostics companies?",
  "Which members are impacted by this MHRA consultation?",
  "Which updates require member communication?",
  "Which updates affect AI-enabled medical devices?",
  "Which working groups should be informed?",
];

export default function RegulatoryIntelligenceWorkspace({ clients, view }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dashboard = useMemo(() => buildAbhiRegulatoryDashboard(clients), [clients]);
  const focusId =
    searchParams.get("updateId")?.trim() ||
    dashboard.todaysBrief.updateId;

  function setView(next: RegulatoryIntelligenceView, updateId?: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    if (updateId) url.searchParams.set("updateId", updateId);
    else url.searchParams.delete("updateId");
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  function exportPdf(kind: AbhiRegulatoryExportKind) {
    downloadAbhiRegulatoryPdf(kind, dashboard, focusId);
  }

  return (
    <div className="space-y-5 p-1">
      {view === "regulatory-dashboard" ? (
        <DashboardView
          dashboard={dashboard}
          onOpenUpdate={(id) => setView("regulatory-updates", id)}
          onOpenImpact={(id) => setView("regulatory-impact", id)}
          onOpenAlerts={() => setView("regulatory-alerts")}
          onExport={exportPdf}
        />
      ) : null}
      {view === "regulatory-updates" ? (
        <UpdatesView
          dashboard={dashboard}
          focusId={focusId}
          onSelect={(id) => setView("regulatory-updates", id)}
          onOpenImpact={(id) => setView("regulatory-impact", id)}
          onExport={exportPdf}
        />
      ) : null}
      {view === "regulatory-impact" ? (
        <ImpactView
          dashboard={dashboard}
          focusId={focusId}
          onSelect={(id) => setView("regulatory-impact", id)}
          onExport={exportPdf}
        />
      ) : null}
      {view === "regulatory-alerts" ? (
        <AlertsView
          dashboard={dashboard}
          onOpenImpact={(id) => setView("regulatory-impact", id)}
        />
      ) : null}
    </div>
  );
}

function DashboardView({
  dashboard,
  onOpenUpdate,
  onOpenImpact,
  onOpenAlerts,
  onExport,
}: {
  dashboard: ReturnType<typeof buildAbhiRegulatoryDashboard>;
  onOpenUpdate: (id: string) => void;
  onOpenImpact: (id: string) => void;
  onOpenAlerts: () => void;
  onExport: (kind: AbhiRegulatoryExportKind) => void;
}) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<{ from: "user" | "ai"; text: string }[]>([
    {
      from: "ai",
      text: "Ask Regulatory Intelligence about diagnostics impact, MHRA consultations, member communications, AI devices, or working groups.",
    },
  ]);

  function ask(question: string) {
    const q = question.trim();
    if (!q) return;
    setMessages((current) => [
      ...current,
      { from: "user", text: q },
      { from: "ai", text: answerRegulatoryQuestion(q, dashboard) },
    ]);
    setDraft("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    ask(draft);
  }

  const brief = dashboard.todaysBrief;

  return (
    <>
      <header className="rounded-2xl border border-white/12 bg-gradient-to-br from-[#C2185B]/15 via-white/[0.03] to-transparent p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f4a6c4]/80">
          Regulatory Intelligence
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          What changed, why it matters, who is affected, and what ABHI should do next.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Tile label="Open Regulatory Changes" value={String(dashboard.openRegulatoryChanges)} />
          <Tile label="High Impact Updates" value={String(dashboard.highImpactUpdates)} tone="risk" />
          <Tile
            label="Members Potentially Affected"
            value={String(dashboard.membersPotentiallyAffected)}
            tone="accent"
          />
          <Tile
            label="Pending Impact Assessments"
            value={String(dashboard.pendingImpactAssessments)}
          />
          <Tile label="Recent Regulatory Alerts" value={String(dashboard.recentAlerts.length)} />
        </div>
      </header>

      <section className="rounded-2xl border border-[#C2185B]/30 bg-gradient-to-br from-[#C2185B]/14 to-transparent p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f4a6c4]/80">
              AI Regulatory Brief
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">Today&apos;s Regulatory Brief</h2>
            <p className="mt-1 text-[11px] text-white/40">Connector refresh · {brief.refreshedAt}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportButton label="Regulatory Briefing" onClick={() => onExport("regulatory-briefing")} />
            <ExportButton label="Board Summary" onClick={() => onExport("board-summary")} />
          </div>
        </div>
        <p className="mt-4 text-base font-medium text-white">{brief.headline}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Tile
            label="Potentially affected members"
            value={String(brief.potentiallyAffectedMembers)}
            tone="accent"
          />
          <div className="rounded-xl border border-white/12 bg-black/25 px-3 py-3 sm:col-span-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/45">
              Highest impact sectors
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {brief.highestImpactSectors.map((sector) => (
                <span
                  key={sector}
                  className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/75"
                >
                  {sector}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Recommended actions
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-white/75">
              {brief.recommendedActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              onClick={() => onOpenUpdate(brief.updateId)}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10"
            >
              View update
            </button>
            <button
              type="button"
              onClick={() => onOpenImpact(brief.updateId)}
              className="rounded-lg border border-[#C2185B]/40 bg-[#C2185B]/20 px-3 py-2 text-xs font-semibold text-[#f4a6c4] hover:bg-[#C2185B]/30"
            >
              View impact assessment
            </button>
          </div>
        </div>
      </section>

      <AbhiActionsPanel actions={dashboard.abhiActions} onOpenAlerts={onOpenAlerts} />

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold text-white">Recent regulatory alerts</h2>
          <ul className="mt-3 space-y-2">
            {dashboard.recentAlerts.map((alert) => (
              <li
                key={alert.memberId}
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{alert.memberName}</p>
                  <PriorityBadge priority={alert.priority} />
                </div>
                <p className="mt-1 text-xs font-medium text-white/70">{alert.mostRelevantUpdate}</p>
                <p className="mt-1 text-xs text-white/50">{alert.whyItMatters}</p>
                <p className="mt-1 text-[11px] text-[#f4a6c4]">
                  Next: {alert.recommendedAction.split("\n")[0]} · Owner {alert.owner}
                </p>
              </li>
            ))}
            {dashboard.recentAlerts.length === 0 ? (
              <li className="text-sm text-white/45">No high-priority member alerts.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#f4a6c4]" />
            <h2 className="text-sm font-semibold text-white">Ask Regulatory Intelligence</h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {AI_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                className="rounded-full border border-white/12 bg-black/20 px-2.5 py-1 text-[11px] text-white/65 hover:border-[#C2185B]/40 hover:text-white"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-3">
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
              placeholder="Ask about regulatory impact…"
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

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
          Live data sources · daily refresh
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {dashboard.sources.map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-black/20 px-2.5 py-1 text-[11px] text-white/65 hover:text-[#f4a6c4]"
            >
              {source.name}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

function UpdatesView({
  dashboard,
  focusId,
  onSelect,
  onOpenImpact,
  onExport,
}: {
  dashboard: ReturnType<typeof buildAbhiRegulatoryDashboard>;
  focusId: string;
  onSelect: (id: string) => void;
  onOpenImpact: (id: string) => void;
  onExport: (kind: AbhiRegulatoryExportKind) => void;
}) {
  const selected =
    dashboard.updates.find((u) => u.id === focusId) ?? dashboard.updates[0]!;

  return (
    <>
      <Header
        title="Regulatory Updates"
        subtitle="Structured intelligence from MHRA, NICE, NHS England, DHSC, UK consultations, FDA, and EU MDR."
      />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <section className="space-y-2">
          {dashboard.updates.map((update) => (
            <button
              key={update.id}
              type="button"
              onClick={() => onSelect(update.id)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition",
                update.id === selected.id
                  ? "border-[#C2185B]/45 bg-[#C2185B]/10"
                  : "border-white/12 bg-black/20 hover:border-white/25",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white">{update.title}</p>
                <SeverityBadge severity={update.severity} />
              </div>
              <p className="mt-1 text-xs text-white/45">
                {update.sourceName} · {formatRegulatoryDate(update.publicationDate)} ·{" "}
                {update.category}
              </p>
              <p className="mt-2 line-clamp-2 text-xs text-white/65">{update.summary}</p>
            </button>
          ))}
        </section>
        <UpdateDetail
          update={selected}
          assessment={dashboard.assessments.find((a) => a.updateId === selected.id)!}
          onOpenImpact={() => onOpenImpact(selected.id)}
          onExport={() => onExport("regulatory-briefing")}
        />
      </div>
    </>
  );
}

function ImpactView({
  dashboard,
  focusId,
  onSelect,
  onExport,
}: {
  dashboard: ReturnType<typeof buildAbhiRegulatoryDashboard>;
  focusId: string;
  onSelect: (id: string) => void;
  onExport: (kind: AbhiRegulatoryExportKind) => void;
}) {
  const assessment =
    dashboard.assessments.find((a) => a.updateId === focusId) ?? dashboard.assessments[0]!;
  const update =
    dashboard.updates.find((u) => u.id === assessment.updateId) ?? dashboard.updates[0]!;

  return (
    <>
      <Header
        title="Impact Assessments"
        subtitle="Automatic member matching and recommended ABHI interventions for each regulatory update."
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <ExportButton label="Member Impact Report" onClick={() => onExport("member-impact")} />
        <ExportButton label="Working Group Briefing" onClick={() => onExport("working-group")} />
        <ExportButton label="Board Summary" onClick={() => onExport("board-summary")} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.2fr]">
        <section className="space-y-2">
          {dashboard.assessments.map((item) => {
            const u = dashboard.updates.find((row) => row.id === item.updateId)!;
            return (
              <button
                key={item.updateId}
                type="button"
                onClick={() => onSelect(item.updateId)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left",
                  item.updateId === assessment.updateId
                    ? "border-[#C2185B]/45 bg-[#C2185B]/10"
                    : "border-white/12 bg-black/20 hover:border-white/25",
                )}
              >
                <p className="text-sm font-semibold text-white">{u.title}</p>
                <p className="mt-1 text-xs text-white/50">
                  {item.affectedMembers.length} members · Risk {item.riskLevel}
                </p>
              </button>
            );
          })}
        </section>
        <ImpactDetail update={update} assessment={assessment} />
      </div>
    </>
  );
}

function AlertsView({
  dashboard,
  onOpenImpact,
}: {
  dashboard: ReturnType<typeof buildAbhiRegulatoryDashboard>;
  onOpenImpact: (id: string) => void;
}) {
  return (
    <>
      <Header
        title="Member Alerts"
        subtitle="Actionable outreach queue — most relevant update, owner, and target date for each member."
      />
      <div className="space-y-3">
        {dashboard.memberAlerts.map((alert) => (
          <div
            key={alert.memberId}
            className="rounded-xl border border-white/12 bg-white/[0.03] px-4 py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-white">{alert.memberName}</h3>
              <PriorityBadge priority={alert.priority} />
            </div>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
              <div className="sm:col-span-2">
                <dt className="text-[10px] uppercase tracking-wide text-white/40">
                  Most relevant update
                </dt>
                <dd className="mt-0.5 text-white/85">{alert.mostRelevantUpdate}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-white/40">Why it matters</dt>
                <dd className="mt-0.5 text-white/70">{alert.whyItMatters}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-white/40">
                  Recommended action
                </dt>
                <dd className="mt-0.5 whitespace-pre-line text-white/70">{alert.recommendedAction}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-white/40">Owner</dt>
                <dd className="mt-0.5 text-white/70">{alert.owner}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-white/40">Target date</dt>
                <dd className="mt-0.5 text-white/70">{formatRegulatoryDate(alert.targetDate)}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => onOpenImpact(alert.mostRelevantUpdateId)}
              className="mt-3 rounded-lg border border-[#C2185B]/40 bg-[#C2185B]/20 px-3 py-1.5 text-xs font-semibold text-[#f4a6c4] hover:bg-[#C2185B]/30"
            >
              View Impact Assessment
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function UpdateDetail({
  update,
  assessment,
  onOpenImpact,
  onExport,
}: {
  update: AbhiRegulatoryUpdate;
  assessment: AbhiRegulatoryImpactAssessment;
  onOpenImpact: () => void;
  onExport: () => void;
}) {
  return (
    <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Update detail</p>
      <h2 className="mt-1 text-lg font-semibold text-white">{update.title}</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <Row label="Source" value={update.sourceName} />
        <Row label="Publication Date" value={formatRegulatoryDate(update.publicationDate)} />
        <Row label="Category" value={update.category} />
        <Row label="Severity" value={update.severity} />
        <Row label="Status" value={update.status} />
      </dl>
      <p className="mt-3 text-sm text-white/70">{update.summary}</p>
      <p className="mt-2 text-sm text-white/55">{update.fullDescription}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {update.affectedSectors.map((s) => (
          <Chip key={s}>{s}</Chip>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpenImpact}
          className="rounded-lg border border-[#C2185B]/40 bg-[#C2185B]/20 px-3 py-2 text-xs font-semibold text-[#f4a6c4]"
        >
          View Impact Assessment
        </button>
        <ExportButton label="Export Briefing PDF" onClick={onExport} />
        <a
          href={update.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/75"
        >
          Source URL <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <p className="mt-3 text-xs text-white/40">
        {assessment.affectedMembers.length} members matched · Risk {assessment.riskLevel}
      </p>
    </section>
  );
}

function ImpactDetail({
  update,
  assessment,
}: {
  update: AbhiRegulatoryUpdate;
  assessment: AbhiRegulatoryImpactAssessment;
}) {
  return (
    <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
        Impact assessment
      </p>
      <h2 className="mt-1 text-lg font-semibold text-white">{update.title}</h2>
      <p className="mt-3 text-sm text-white/75">{assessment.summary}</p>
      <p className="mt-2 text-sm text-white/60">
        <span className="font-semibold text-white/80">Why it matters: </span>
        {assessment.whyItMatters}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Risk level</p>
          <p className="mt-1 text-lg font-semibold text-white">{assessment.riskLevel}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Affected sectors</p>
          <p className="mt-1 text-sm text-white/75">{assessment.affectedSectors.join(" · ")}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
          Affected members — actionable impact
        </p>
        {assessment.affectedMembers.slice(0, 10).map((member) => (
          <article
            key={member.id}
            className="rounded-xl border border-white/10 bg-black/25 px-4 py-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">{member.memberName}</h3>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
                Impact Score: {member.impactScore}%
              </span>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs">
              <div>
                <p className="uppercase tracking-wide text-white/40">Why affected</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-white/70">
                  {member.whyAffected.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="uppercase tracking-wide text-white/40">Relevant technologies</p>
                <p className="mt-1 text-white/70">{member.relevantTechnologies.join(" · ")}</p>
                <p className="mt-2 uppercase tracking-wide text-white/40">Relevant products</p>
                <p className="mt-1 text-white/70">{member.relevantProducts.join(" · ")}</p>
              </div>
            </div>
            <p className="mt-3 rounded-lg border border-[#C2185B]/25 bg-[#C2185B]/10 px-3 py-2 text-xs text-[#f4a6c4]">
              <span className="font-semibold">Recommended ABHI action: </span>
              {member.recommendedAbhiAction}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
          Portfolio recommended actions
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-white/75">
          {assessment.recommendedActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AbhiActionsPanel({
  actions,
  onOpenAlerts,
}: {
  actions: ReturnType<typeof buildAbhiRegulatoryDashboard>["abhiActions"];
  onOpenAlerts: () => void;
}) {
  return (
    <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f4a6c4]/80">
        Action centre
      </p>
      <h2 className="mt-1 text-lg font-semibold text-white">ABHI Actions</h2>
      <p className="mt-1 text-sm text-white/50">
        Exactly what ABHI staff should do next — not just who is affected.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Tile label="Prepare Member Briefings" value={String(actions.prepareMemberBriefings)} tone="accent" />
        <Tile label="Schedule Regulatory Webinars" value={String(actions.scheduleRegulatoryWebinars)} />
        <Tile label="Members Requiring Outreach" value={String(actions.membersRequiringOutreach)} tone="risk" />
        <Tile label="Consultation Responses Due" value={String(actions.consultationResponsesDue)} tone="risk" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Required ABHI actions
          </p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm text-white/75">
            {actions.requiredAbhiActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Notify working groups
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-white/75">
            {actions.notifyWorkingGroups.map((group) => (
              <li key={group}>{group}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-white/45">{actions.consultationDueLabel}</p>
          <button
            type="button"
            onClick={onOpenAlerts}
            className="mt-3 rounded-lg border border-[#C2185B]/40 bg-[#C2185B]/20 px-3 py-1.5 text-xs font-semibold text-[#f4a6c4] hover:bg-[#C2185B]/30"
          >
            Open priority impact / outreach
          </button>
        </div>
      </div>
    </section>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
      <div className="flex items-center gap-2">
        <Landmark className="h-5 w-5 text-[#f4a6c4]" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Regulatory Intelligence
          </p>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
        </div>
      </div>
      <p className="mt-2 text-sm text-white/55">{subtitle}</p>
    </header>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "risk" | "accent";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3",
        tone === "risk" && "border-amber-400/30 bg-amber-500/10",
        tone === "accent" && "border-[#C2185B]/35 bg-[#C2185B]/12",
        !tone && "border-white/12 bg-black/25",
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/45">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/75">
      {children}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/8 pb-1.5">
      <dt className="text-white/40">{label}</dt>
      <dd className="text-right text-white/85">{value}</dd>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const tone =
    severity === "High" || severity === "Critical"
      ? "border-rose-400/30 bg-rose-500/15 text-rose-100"
      : severity === "Medium"
        ? "border-amber-400/30 bg-amber-500/15 text-amber-100"
        : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", tone)}>
      {severity}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return <SeverityBadge severity={priority === "High" ? "High" : priority === "Medium" ? "Medium" : "Low"} />;
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10"
    >
      <FileDown className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
