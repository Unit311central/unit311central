"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  FolderOpen,
  Link2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  FUNDING_ROUNDS,
  FUNDRAISING_DATA_ROOMS,
  FUNDRAISING_MEETINGS,
  FUNDRAISING_PIPELINE,
  FUNDRAISING_PITCH_DECKS,
  ONWARDAIR_CAPITAL_COMMITTED_USD,
  ONWARDAIR_SEED_RAISE_TARGET_USD,
  formatUsdCompact,
  formatUsdFull,
  getPreSeedFromCapTable,
  type FundingRoundId,
  type FundingRoundStatus,
  type PitchDeckVersion,
} from "@/lib/onwardair/fundraising-data";
import { cn } from "@/lib/utils";
import {
  CorporateFieldLabel,
  CorporateKpiTile,
  CorporateSection,
  CorporateStatusPill,
  corporateInputClass,
  corporatePrimaryButtonClass,
  corporateSecondaryButtonClass,
} from "@/components/testflighthub/corporate-ui";
import { useCorporateMockStore } from "@/components/testflighthub/useCorporateMockStore";
import { useOperatorEntitlements } from "@/components/testflighthub/OperatorEntitlementsProvider";
import {
  buildFundraisingWorkspaceEyebrow,
  resolveFundraisingSurfaceKind,
} from "@/lib/fundraising-workspace-surface";
import {
  WORKSPACE_FUNDING_ROUNDS,
  WORKSPACE_FUNDRAISING_DATA_ROOMS,
  WORKSPACE_FUNDRAISING_MEETINGS,
  WORKSPACE_FUNDRAISING_PIPELINE,
  WORKSPACE_FUNDRAISING_PITCH_DECKS,
  getWorkspacePreSeedFromCapTable,
} from "@/lib/workspace-fundraising-data";
import { brandFromWorkspaceClaim } from "@/lib/workspace-brand";

function useFundraisingPresentation() {
  const { workspaceSlug, workspaceName } = useOperatorEntitlements();
  const surface = resolveFundraisingSurfaceKind(workspaceSlug);
  const isWorkspace = surface === "workspace";

  return {
    isWorkspace,
    eyebrow: isWorkspace
      ? buildFundraisingWorkspaceEyebrow({ workspaceSlug, workspaceName })
      : "OnwardAir · Fundraising",
    fundingRounds: isWorkspace ? WORKSPACE_FUNDING_ROUNDS : FUNDING_ROUNDS,
    pipeline: isWorkspace ? WORKSPACE_FUNDRAISING_PIPELINE : FUNDRAISING_PIPELINE,
    meetings: isWorkspace ? WORKSPACE_FUNDRAISING_MEETINGS : FUNDRAISING_MEETINGS,
    pitchDecks: isWorkspace ? WORKSPACE_FUNDRAISING_PITCH_DECKS : FUNDRAISING_PITCH_DECKS,
    dataRooms: isWorkspace ? WORKSPACE_FUNDRAISING_DATA_ROOMS : FUNDRAISING_DATA_ROOMS,
    seedRaiseTargetUsd: isWorkspace ? null : ONWARDAIR_SEED_RAISE_TARGET_USD,
    capitalCommittedUsd: isWorkspace ? null : ONWARDAIR_CAPITAL_COMMITTED_USD,
    resolvePreSeed: isWorkspace ? getWorkspacePreSeedFromCapTable : getPreSeedFromCapTable,
  };
}

function roundStatusClass(status: FundingRoundStatus) {
  switch (status) {
    case "Active":
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
    case "Closed":
      return "border-sky-400/30 bg-sky-500/15 text-sky-200";
    case "Planned":
      return "border-amber-400/30 bg-amber-500/15 text-amber-200";
    default:
      return "border-white/15 bg-white/[0.06] text-white/55";
  }
}

function formatDate(iso: string) {
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PageHeader({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle: string;
  eyebrow: string;
}) {
  return (
    <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {eyebrow}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{subtitle}</p>
    </header>
  );
}

function tableWrapClass() {
  return "overflow-x-auto rounded-xl border border-white/10";
}

function thClass() {
  return "px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40";
}

function tdClass() {
  return "px-3 py-2.5 text-sm text-white/85";
}

/** Fundraising Dashboard — KPI row + LHS round tiles + detail pane. */
export function FundraisingDashboardWorkspace() {
  const presentation = useFundraisingPresentation();
  const store = useCorporateMockStore();
  const preSeed = useMemo(
    () => presentation.resolvePreSeed(store.shareholders),
    [presentation, store.shareholders],
  );
  const [selectedRoundId, setSelectedRoundId] = useState<FundingRoundId>("pre-seed");
  const selected =
    presentation.fundingRounds.find((r) => r.id === selectedRoundId) ??
    presentation.fundingRounds[0];
  const activeRaises = presentation.fundingRounds.filter((r) => r.status === "Active").length;

  const raisedDisplay =
    selected.id === "pre-seed"
      ? preSeed.raisedUsd > 0
        ? formatUsdCompact(preSeed.raisedUsd)
        : "—"
      : selected.status === "Active"
        ? "In progress"
        : "—";
  const investorsDisplay =
    selected.id === "pre-seed"
      ? String(preSeed.investorCount)
      : selected.status === "Active"
        ? String(presentation.pipeline.filter((d) => d.stage !== "Passed").length)
        : "—";
  const targetDisplay =
    selected.targetUsd != null
      ? formatUsdCompact(selected.targetUsd)
      : presentation.seedRaiseTargetUsd != null
        ? formatUsdCompact(presentation.seedRaiseTargetUsd)
        : "—";
  const committedDisplay =
    presentation.capitalCommittedUsd != null
      ? formatUsdCompact(presentation.capitalCommittedUsd)
      : preSeed.raisedUsd > 0
        ? formatUsdCompact(preSeed.raisedUsd)
        : preSeed.investorCount > 0
          ? String(preSeed.investorCount)
          : "—";
  const committedHint =
    presentation.isWorkspace
      ? "External investors · Cap Table"
      : "Pre-Seed closed · Cap Table";

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-6">
      <PageHeader
        eyebrow={presentation.eyebrow}
        title="Dashboard"
        subtitle="Active raises, capital progress, and round detail. Pre-Seed figures sync from Cap Table Management."
      />

      <section data-ai-target="fundraising-kpis" className="grid gap-3 sm:grid-cols-3">
        <CorporateKpiTile
          label="Active Raises"
          value={activeRaises}
          hint={presentation.isWorkspace ? "Planned and active rounds" : "Seed round open"}
        />
        <CorporateKpiTile
          label="Raise Targets"
          value={targetDisplay}
          hint={presentation.isWorkspace ? "Configured round targets" : "Seed target · active raise"}
        />
        <CorporateKpiTile
          label="Capital Committed"
          value={committedDisplay}
          hint={committedHint}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-2">
          <p className="px-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Rounds
          </p>
          {presentation.fundingRounds.map((round) => {
            const active = round.id === selectedRoundId;
            return (
              <button
                key={round.id}
                type="button"
                onClick={() => setSelectedRoundId(round.id)}
                className={cn(
                  "w-full rounded-xl border px-3.5 py-3 text-left transition",
                  active
                    ? "border-amber-400/40 bg-amber-500/15 shadow-[0_0_0_1px_rgba(251,191,36,0.12)]"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white">{round.name}</span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]",
                      roundStatusClass(round.status),
                    )}
                  >
                    {round.status}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-white/45">{round.focus}</p>
              </button>
            );
          })}
        </aside>

        <article className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/[0.07] via-white/[0.03] to-transparent p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/80">
                {selected.focus}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">{selected.name}</h2>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                roundStatusClass(selected.status),
              )}
            >
              {selected.status}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/60">{selected.typicalUse}</p>

          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#0b1524]/60 px-3.5 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                Target
              </dt>
              <dd className="mt-1.5 text-xl font-semibold tabular-nums text-white">
                {targetDisplay}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b1524]/60 px-3.5 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                Raised
              </dt>
              <dd className="mt-1.5 text-xl font-semibold tabular-nums text-white">
                {raisedDisplay}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b1524]/60 px-3.5 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                Investors
              </dt>
              <dd className="mt-1.5 text-xl font-semibold tabular-nums text-white">
                {investorsDisplay}
              </dd>
            </div>
          </dl>

          {selected.id === "pre-seed" ? (
            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                Cap table investors
              </p>
              <ul className="mt-2 space-y-2">
                {preSeed.investors.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-white">{row.shareholder}</span>
                    <span className="text-xs text-white/45">
                      {row.shareClass} · {row.shares.toLocaleString()} shares
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="mt-4 text-xs text-white/40">{selected.notes}</p>
        </article>
      </div>
    </div>
  );
}

/** Investors — sourced from Cap Table Management. */
export function FundraisingInvestorsWorkspace() {
  const presentation = useFundraisingPresentation();
  const store = useCorporateMockStore();
  const investors = useMemo(
    () => presentation.resolvePreSeed(store.shareholders).investors,
    [presentation, store.shareholders],
  );
  const totalShares = investors.reduce((sum, row) => sum + row.shares, 0);
  const committedDisplay =
    presentation.capitalCommittedUsd != null
      ? formatUsdCompact(presentation.capitalCommittedUsd)
      : "—";

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-6">
      <PageHeader
        eyebrow={presentation.eyebrow}
        title="Investors"
        subtitle={
          presentation.isWorkspace
            ? "Investor records from Cap Table Management — external capital holders on this workspace register."
            : "Investor records from Cap Table Management — external capital holders on the OnwardAir register."
        }
      />

      <section data-ai-target="fundraising-kpis" className="grid gap-3 sm:grid-cols-3">
        <CorporateKpiTile label="Investors" value={investors.length} hint="From cap table" />
        <CorporateKpiTile
          label="Capital Committed"
          value={committedDisplay}
          hint={presentation.isWorkspace ? "Cap Table external investors" : "Pre-Seed · Cap Table"}
        />
        <CorporateKpiTile
          label="Shares held"
          value={totalShares.toLocaleString()}
          hint="External allotments"
        />
      </section>

      <CorporateSection
        title="Cap table investors"
        subtitle="Excludes founding team and ESOP. Edit ownership under Cap Table Management."
      >
        <div className={tableWrapClass()}>
          <table className="min-w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={thClass()}>Investor</th>
                <th className={thClass()}>Share class</th>
                <th className={thClass()}>Shares</th>
                <th className={thClass()}>Issue price</th>
                <th className={thClass()}>Issue date</th>
                <th className={thClass()}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {investors.map((row) => (
                <tr key={row.id} className="border-b border-white/5 last:border-0">
                  <td className={cn(tdClass(), "font-medium text-white")}>{row.shareholder}</td>
                  <td className={tdClass()}>{row.shareClass}</td>
                  <td className={cn(tdClass(), "tabular-nums")}>{row.shares.toLocaleString()}</td>
                  <td className={tdClass()}>{row.price || "—"}</td>
                  <td className={tdClass()}>{formatDate(row.issueDate)}</td>
                  <td className={cn(tdClass(), "max-w-xs text-white/55")}>{row.notes || "—"}</td>
                </tr>
              ))}
              {investors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-white/45">
                    No external investors on the cap table yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CorporateSection>
    </div>
  );
}

const PIPELINE_STAGES = [
  "Intro",
  "Pitch sent",
  "Meeting",
  "Diligence",
  "Term sheet",
  "Passed",
] as const;

function stagePillClass(stage: string) {
  if (stage === "Term sheet" || stage === "Diligence") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  }
  if (stage === "Passed") {
    return "border-white/15 bg-white/5 text-white/50";
  }
  if (stage === "Meeting" || stage === "Pitch sent") {
    return "border-sky-400/30 bg-sky-500/15 text-sky-100";
  }
  return "border-amber-400/30 bg-amber-500/15 text-amber-100";
}

/** Pipeline — fake Seed round (ongoing / not finished). */
export function FundraisingPipelineWorkspace() {
  const presentation = useFundraisingPresentation();
  const openDeals = presentation.pipeline.filter((d) => d.stage !== "Passed");
  const pipelineUsd = openDeals.reduce((sum, d) => sum + d.amountUsd, 0);
  const seedTargetDisplay =
    presentation.seedRaiseTargetUsd != null
      ? formatUsdCompact(presentation.seedRaiseTargetUsd)
      : "—";

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-6">
      <PageHeader
        eyebrow={presentation.eyebrow}
        title="Pipeline"
        subtitle={
          presentation.isWorkspace
            ? "Track investor progression across fundraising stages for this workspace."
            : "Seed round in progress — investor progression across stages. Raise not finished."
        }
      />

      <section data-ai-target="fundraising-kpis" className="grid gap-3 sm:grid-cols-3">
        <CorporateKpiTile
          label="Open deals"
          value={openDeals.length}
          hint={presentation.isWorkspace ? "Active pipeline" : "Seed pipeline"}
        />
        <CorporateKpiTile
          label="Pipeline value"
          value={pipelineUsd > 0 ? formatUsdCompact(pipelineUsd) : "—"}
          hint="Excludes passed"
        />
        <CorporateKpiTile
          label="Seed target"
          value={seedTargetDisplay}
          hint={presentation.isWorkspace ? "Configured target" : "Active raise target"}
        />
      </section>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {PIPELINE_STAGES.map((stage) => {
          const count = presentation.pipeline.filter((d) => d.stage === stage).length;
          return (
            <div
              key={stage}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                {stage}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{count}</p>
            </div>
          );
        })}
      </div>

      <CorporateSection
        title={presentation.isWorkspace ? "Pipeline deals" : "Seed round deals"}
        subtitle={
          presentation.isWorkspace
            ? "Workspace-owned fundraising pipeline records."
            : "Demo pipeline for the ongoing Seed raise."
        }
      >
        <div data-ai-target="fundraising-pipeline-table" className={tableWrapClass()}>
          <table className="min-w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={thClass()}>Investor</th>
                <th className={thClass()}>Firm</th>
                <th className={thClass()}>Stage</th>
                <th className={thClass()}>Amount</th>
                <th className={thClass()}>Owner</th>
                <th className={thClass()}>Last touch</th>
                <th className={thClass()}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {presentation.pipeline.map((deal) => (
                <tr key={deal.id} className="border-b border-white/5 last:border-0">
                  <td className={cn(tdClass(), "font-medium text-white")}>{deal.investor}</td>
                  <td className={tdClass()}>{deal.firm}</td>
                  <td className={tdClass()}>
                    <CorporateStatusPill className={stagePillClass(deal.stage)}>
                      {deal.stage}
                    </CorporateStatusPill>
                  </td>
                  <td className={cn(tdClass(), "tabular-nums")}>
                    {formatUsdFull(deal.amountUsd)}
                  </td>
                  <td className={tdClass()}>{deal.owner}</td>
                  <td className={tdClass()}>{formatDate(deal.lastTouch)}</td>
                  <td className={cn(tdClass(), "max-w-xs text-white/55")}>{deal.notes}</td>
                </tr>
              ))}
              {presentation.pipeline.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-white/45">
                    No pipeline deals yet. Add investor outreach records as your raise progresses.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CorporateSection>
    </div>
  );
}

/** Meetings — upcoming investor meetings. */
export function FundraisingMeetingsWorkspace() {
  const presentation = useFundraisingPresentation();

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-6">
      <PageHeader
        eyebrow={presentation.eyebrow}
        title="Meetings"
        subtitle={
          presentation.isWorkspace
            ? "Schedule and track investor meetings for this workspace."
            : "Upcoming meetings with potential Seed investors — dates, attendees, links, and deck status."
        }
      />

      <section data-ai-target="fundraising-kpis" className="grid gap-3 sm:grid-cols-3">
        <CorporateKpiTile
          label="Upcoming"
          value={presentation.meetings.length}
          hint="Next investor sessions"
        />
        <CorporateKpiTile
          label="Deck sent"
          value={presentation.meetings.filter((m) => m.pitchDeckSent).length}
          hint="Pitch deck already shared"
        />
        <CorporateKpiTile
          label="Confirmed"
          value={presentation.meetings.filter((m) => m.status === "Confirmed").length}
          hint="Locked on calendar"
        />
      </section>

      <CorporateSection
        title="Upcoming investor meetings"
        subtitle={
          presentation.isWorkspace
            ? "Workspace-owned investor meeting schedule."
            : "Demo schedule for Seed outreach."
        }
      >
        <div className={tableWrapClass()}>
          <table className="min-w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={thClass()}>Date</th>
                <th className={thClass()}>Meeting</th>
                <th className={thClass()}>Investor</th>
                <th className={thClass()}>With</th>
                <th className={thClass()}>Link</th>
                <th className={thClass()}>Deck sent?</th>
                <th className={thClass()}>Status</th>
              </tr>
            </thead>
            <tbody>
              {presentation.meetings.map((m) => (
                <tr key={m.id} className="border-b border-white/5 last:border-0">
                  <td className={tdClass()}>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-amber-300/80" aria-hidden />
                      <span>
                        {formatDate(m.date)}
                        <span className="block text-xs text-white/40">{m.time}</span>
                      </span>
                    </div>
                  </td>
                  <td className={cn(tdClass(), "font-medium text-white")}>{m.title}</td>
                  <td className={tdClass()}>
                    <span className="text-white">{m.investor}</span>
                    <span className="block text-xs text-white/40">{m.firm}</span>
                  </td>
                  <td className={cn(tdClass(), "max-w-[12rem] text-white/70")}>{m.withWhom}</td>
                  <td className={tdClass()}>
                    <a
                      href={m.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200"
                    >
                      <Link2 className="h-3.5 w-3.5" aria-hidden />
                      Join
                      <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
                    </a>
                  </td>
                  <td className={tdClass()}>
                    <CorporateStatusPill
                      className={
                        m.pitchDeckSent
                          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                          : "border-amber-400/30 bg-amber-500/15 text-amber-100"
                      }
                    >
                      {m.pitchDeckSent ? "Yes" : "No"}
                    </CorporateStatusPill>
                  </td>
                  <td className={tdClass()}>
                    <CorporateStatusPill
                      className={
                        m.status === "Confirmed"
                          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                          : "border-sky-400/30 bg-sky-500/15 text-sky-100"
                      }
                    >
                      {m.status}
                    </CorporateStatusPill>
                  </td>
                </tr>
              ))}
              {presentation.meetings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-white/45">
                    No investor meetings scheduled yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CorporateSection>
    </div>
  );
}

type DeckFormState = {
  id: string | null;
  version: string;
  title: string;
  fileName: string;
  notes: string;
  lastUpdatedBy: string;
};

function emptyDeckForm(): DeckFormState {
  return {
    id: null,
    version: "",
    title: "",
    fileName: "",
    notes: "",
    lastUpdatedBy: "Dr. Scott Parazynski",
  };
}

function compareDeckVersions(a: PitchDeckVersion, b: PitchDeckVersion) {
  const av = Number.parseFloat(a.version);
  const bv = Number.parseFloat(b.version);
  if (!Number.isNaN(av) && !Number.isNaN(bv) && av !== bv) return bv - av;
  return b.version.localeCompare(a.version, undefined, { numeric: true });
}

/** Pitch Decks — explorer with newest version first; add / edit / delete. */
export function FundraisingPitchDecksWorkspace() {
  const presentation = useFundraisingPresentation();
  const { workspaceSlug, workspaceName } = useOperatorEntitlements();
  const brand = brandFromWorkspaceClaim({ slug: workspaceSlug, name: workspaceName });
  const deckBrandName = presentation.isWorkspace ? brand.displayName : "OnwardAir";
  const [decks, setDecks] = useState<PitchDeckVersion[]>(() =>
    [...presentation.pitchDecks].sort(compareDeckVersions),
  );
  const [form, setForm] = useState<DeckFormState | null>(null);

  const sorted = useMemo(() => [...decks].sort(compareDeckVersions), [decks]);

  function openAdd() {
    const latest = sorted[0];
    const next =
      latest && !Number.isNaN(Number.parseFloat(latest.version))
        ? (Number.parseFloat(latest.version) + 0.1).toFixed(1)
        : "1.0";
    setForm({
      ...emptyDeckForm(),
      version: next,
      title: latest?.title ?? `${deckBrandName} Pitch Deck`,
      fileName: `${deckBrandName.replace(/\s+/g, "_")}_Pitch_v${next}.pdf`,
    });
  }

  function openEdit(deck: PitchDeckVersion) {
    setForm({
      id: deck.id,
      version: deck.version,
      title: deck.title,
      fileName: deck.fileName,
      notes: deck.notes,
      lastUpdatedBy: deck.lastUpdatedBy,
    });
  }

  function saveForm() {
    if (!form) return;
    const version = form.version.trim();
    const title = form.title.trim();
    if (!version || !title) return;
    const now = new Date().toISOString();
    const by = form.lastUpdatedBy.trim() || "Unknown";
    if (form.id) {
      setDecks((prev) =>
        prev.map((d) =>
          d.id === form.id
            ? {
                ...d,
                version,
                title,
                fileName: form.fileName.trim() || d.fileName,
                notes: form.notes.trim(),
                lastUpdatedAt: now,
                lastUpdatedBy: by,
              }
            : d,
        ),
      );
    } else {
      const id = `oa-deck-${Date.now()}`;
      setDecks((prev) => [
        {
          id,
          version,
          title,
          dateAdded: now.slice(0, 10),
          lastUpdatedAt: now,
          lastUpdatedBy: by,
          fileName: form.fileName.trim() || `OnwardAir_Pitch_v${version}.pdf`,
          notes: form.notes.trim(),
        },
        ...prev,
      ]);
    }
    setForm(null);
  }

  function removeDeck(id: string) {
    setDecks((prev) => prev.filter((d) => d.id !== id));
    if (form?.id === id) setForm(null);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-6">
      <PageHeader
        eyebrow={presentation.eyebrow}
        title="Pitch Decks"
        subtitle="Version explorer — newest deck at the top. Add, edit, or remove versions."
      />

      <CorporateSection
        title="Deck versions"
        subtitle="v1.5 and prior revisions for investor outreach."
        actions={
          <button type="button" className={corporatePrimaryButtonClass()} onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" />
            Add version
          </button>
        }
      >
        <ul className="space-y-2">
          {sorted.map((deck, index) => (
            <li
              key={deck.id}
              className={cn(
                "flex flex-wrap items-start justify-between gap-3 rounded-xl border px-4 py-3.5",
                index === 0
                  ? "border-amber-400/35 bg-amber-500/10"
                  : "border-white/10 bg-white/[0.03]",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <FileText
                    className={cn(
                      "h-4 w-4",
                      index === 0 ? "text-amber-200" : "text-white/45",
                    )}
                    aria-hidden
                  />
                  <span className="text-sm font-semibold text-white">
                    Pitch Deck v{deck.version}
                  </span>
                  {index === 0 ? (
                    <CorporateStatusPill className="border-amber-400/30 bg-amber-500/15 text-amber-100">
                      Current
                    </CorporateStatusPill>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-white/70">{deck.title}</p>
                <p className="mt-1 text-xs text-white/40">{deck.fileName}</p>
                <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/45">
                  <div>
                    <span className="text-white/35">Added </span>
                    {formatDate(deck.dateAdded)}
                  </div>
                  <div>
                    <span className="text-white/35">Updated </span>
                    {formatDateTime(deck.lastUpdatedAt)}
                  </div>
                  <div>
                    <span className="text-white/35">By </span>
                    {deck.lastUpdatedBy}
                  </div>
                </dl>
                {deck.notes ? (
                  <p className="mt-2 text-xs text-white/50">{deck.notes}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className={corporateSecondaryButtonClass()}
                  onClick={() => openEdit(deck)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  className={corporateSecondaryButtonClass()}
                  onClick={() => removeDeck(deck.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </CorporateSection>

      {form ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b1524] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              {form.id ? "Edit pitch deck" : "Add pitch deck"}
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <CorporateFieldLabel>Version</CorporateFieldLabel>
                <input
                  className={corporateInputClass()}
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  placeholder="1.5"
                />
              </div>
              <div>
                <CorporateFieldLabel>Title</CorporateFieldLabel>
                <input
                  className={corporateInputClass()}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <CorporateFieldLabel>File name</CorporateFieldLabel>
                <input
                  className={corporateInputClass()}
                  value={form.fileName}
                  onChange={(e) => setForm({ ...form, fileName: e.target.value })}
                />
              </div>
              <div>
                <CorporateFieldLabel>Last updated by</CorporateFieldLabel>
                <input
                  className={corporateInputClass()}
                  value={form.lastUpdatedBy}
                  onChange={(e) => setForm({ ...form, lastUpdatedBy: e.target.value })}
                />
              </div>
              <div>
                <CorporateFieldLabel>Notes</CorporateFieldLabel>
                <textarea
                  className={cn(corporateInputClass(), "min-h-[72px]")}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className={corporateSecondaryButtonClass()}
                onClick={() => setForm(null)}
              >
                Cancel
              </button>
              <button type="button" className={corporatePrimaryButtonClass()} onClick={saveForm}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Data Rooms — investor diligence folders. */
export function FundraisingDataRoomsWorkspace() {
  const presentation = useFundraisingPresentation();

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-6">
      <PageHeader
        eyebrow={presentation.eyebrow}
        title="Data Rooms"
        subtitle={
          presentation.isWorkspace
            ? "Share diligence materials with investors from this workspace."
            : "Active investor data rooms — folder links and last update."
        }
      />

      <section data-ai-target="fundraising-kpis" className="grid gap-3 sm:grid-cols-3">
        <CorporateKpiTile
          label="Active rooms"
          value={presentation.dataRooms.length}
          hint="Current investors"
        />
        <CorporateKpiTile
          label="Open access"
          value={presentation.dataRooms.filter((r) => r.status === "Open").length}
          hint="Full folder access"
        />
        <CorporateKpiTile
          label="Documents"
          value={presentation.dataRooms.reduce((sum, r) => sum + r.documents, 0)}
          hint="Across all rooms"
        />
      </section>

      <CorporateSection
        title="Investor data rooms"
        subtitle={
          presentation.isWorkspace
            ? "Workspace-owned investor data rooms."
            : "One row per current investor data room."
        }
      >
        <div className={tableWrapClass()}>
          <table className="min-w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={thClass()}>Investor</th>
                <th className={thClass()}>Firm</th>
                <th className={thClass()}>Folder</th>
                <th className={thClass()}>Documents</th>
                <th className={thClass()}>Last updated</th>
                <th className={thClass()}>Updated by</th>
                <th className={thClass()}>Status</th>
              </tr>
            </thead>
            <tbody>
              {presentation.dataRooms.map((room) => (
                <tr key={room.id} className="border-b border-white/5 last:border-0">
                  <td className={cn(tdClass(), "font-medium text-white")}>{room.investor}</td>
                  <td className={tdClass()}>{room.firm}</td>
                  <td className={tdClass()}>
                    <a
                      href={room.folderLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200"
                    >
                      <FolderOpen className="h-3.5 w-3.5" aria-hidden />
                      Open folder
                      <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
                    </a>
                  </td>
                  <td className={cn(tdClass(), "tabular-nums")}>{room.documents}</td>
                  <td className={tdClass()}>{formatDateTime(room.lastUpdatedAt)}</td>
                  <td className={tdClass()}>{room.lastUpdatedBy}</td>
                  <td className={tdClass()}>
                    <CorporateStatusPill
                      className={
                        room.status === "Open"
                          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                          : room.status === "Restricted"
                            ? "border-amber-400/30 bg-amber-500/15 text-amber-100"
                            : "border-white/15 bg-white/5 text-white/50"
                      }
                    >
                      {room.status}
                    </CorporateStatusPill>
                  </td>
                </tr>
              ))}
              {presentation.dataRooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-white/45">
                    No investor data rooms configured yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CorporateSection>
    </div>
  );
}
