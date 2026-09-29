"use client";

import { startTransition, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  LayoutGrid,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { TalantonMeetingEditor } from "@/components/talanton/governance/TalantonMeetingEditor";
import BoardDashboardRiskHeatMap from "@/components/talanton/board/BoardDashboardRiskHeatMap";
import TalantonRiskRegisterWorkspace from "@/components/testflighthub/talanton/TalantonRiskRegisterWorkspace";
import BoardImpactIntelligencePage from "@/components/talanton/board/BoardImpactIntelligencePage";
import BoardJourneyStoriesPage from "@/components/talanton/board/BoardJourneyStoriesPage";
import { loadAbhiBoardPacks } from "@/lib/abhi/board-pack-record";
import { loadViewTileLayout, saveViewTileLayout } from "@/lib/dashboard-view-tiles";
import {
  BOARD_DASHBOARD_TILE_IDS,
  BOARD_DASHBOARD_TILE_LABELS,
  BOARD_DASHBOARD_TILE_STORAGE_KEY,
  DEFAULT_BOARD_DASHBOARD_TILE_LAYOUT,
  type BoardDashboardTileId,
} from "@/lib/talanton/board-dashboard-tiles";
import {
  buildTiMinutesFromMeetings,
  getTiDemoApprovedBoardPacks,
  type TiBoardMeeting,
  type TiBoardMember,
  type TiBoardPack,
  type TiBoardPortalSection,
  type TiMinutesRecord,
} from "@/lib/talanton/board-portal-data";
import {
  addMember,
  getBoardMembersServerSnapshot,
  getBoardMembersState,
  removeMember,
  subscribeBoardMembersStore,
  updateMember,
} from "@/lib/talanton/board-members-store";
import { buildBoardImpactIntelligence } from "@/lib/talanton/board-impact-intelligence";
import { impactReportsAsBoardPackRows } from "@/lib/talanton/annual-impact-report-store";
import {
  createMeeting,
  getTalantonGovernanceServerSnapshot,
  getTalantonGovernanceSnapshot,
  listMeetings,
  subscribeTalantonGovernanceStore,
  type GovernanceMeeting,
} from "@/lib/talanton/governance-store";
import { cn } from "@/lib/utils";

type Props = {
  section: TiBoardPortalSection;
};

function useApprovedPacks(): TiBoardPack[] {
  return useMemo(() => {
    if (typeof window === "undefined") return getTiDemoApprovedBoardPacks();
    const stored = loadAbhiBoardPacks()
      .filter((p) => p.status === "Final")
      .map(
        (p): TiBoardPack => ({
          id: p.id,
          packName: p.packName,
          meetingDate: p.meetingDate,
          status: "Final",
          createdAt: p.createdAt,
          pdfOpenUrl: p.pdfOpenUrl || "#",
          pptxDownloadUrl: p.pptxDownloadUrl || "#",
        }),
      );
    return stored.length > 0 ? stored : getTiDemoApprovedBoardPacks();
  }, []);
}

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5",
        className,
      )}
    >
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function formatBoardMeetingDate(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function agendaLinesFromMinutes(minutes: string): string[] {
  const trimmed = minutes.trim();
  if (!trimmed) return ["Agenda to be confirmed."];
  return trimmed
    .split(/\n+/)
    .map((line) => line.replace(/^[\s•\-*]+/, "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

function mapGovernanceToTiBoardMeeting(m: GovernanceMeeting): TiBoardMeeting {
  return {
    id: m.id,
    meetingDate: m.meetingDate,
    title: m.title,
    status: m.status,
    agenda: agendaLinesFromMinutes(m.minutes),
    decisions: m.decisions.map((d) => ({
      id: d.id,
      text: d.text,
      resolution: d.status === "Approved" ? "Approved" : undefined,
    })),
    actions: m.actions,
    notes: m.minutes,
    resolutions: m.decisions
      .filter((d) => d.status === "Approved")
      .map((d) => d.text),
  };
}

function useBoardGovernanceMeetings() {
  const snap = useSyncExternalStore(
    subscribeTalantonGovernanceStore,
    getTalantonGovernanceSnapshot,
    getTalantonGovernanceServerSnapshot,
  );
  const boardMeetings = useMemo(
    () =>
      listMeetings({ includeArchived: true }).filter((m) => m.meetingType === "Board Meeting"),
    [snap],
  );
  return { snap, boardMeetings };
}

function BoardDashboardTileCustomize({
  layout,
  onLayoutChange,
  customizeOpen,
  onCustomizeOpenChange,
}: {
  layout: BoardDashboardTileId[];
  onLayoutChange: (next: BoardDashboardTileId[]) => void;
  customizeOpen: boolean;
  onCustomizeOpenChange: (open: boolean) => void;
}) {
  const hidden = BOARD_DASHBOARD_TILE_IDS.filter((id) => !layout.includes(id));

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => onCustomizeOpenChange(!customizeOpen)}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
          customizeOpen
            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
            : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:text-white",
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Customize Tiles
      </button>
      {customizeOpen ? (
        <div className="w-full max-w-xl rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="mb-2 text-xs text-white/45">Show or hide dashboard tiles. Order follows the grid below.</p>
          <div className="flex flex-wrap items-center gap-2">
            {hidden.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onLayoutChange([...layout, id])}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200"
              >
                <Plus className="h-3 w-3" />
                {BOARD_DASHBOARD_TILE_LABELS[id]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onLayoutChange([...DEFAULT_BOARD_DASHBOARD_TILE_LAYOUT])}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/55 hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MinutesMeetingSummary({ record }: { record: TiMinutesRecord }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-white">{record.title}</h3>
          <p className="text-sm text-white/45">{formatBoardMeetingDate(record.meetingDate)}</p>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-emerald-200">
          {record.status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-white/70">{record.minutesSummary}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/8 bg-black/20 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Decisions / resolutions
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-white/70">
            {record.decisions.length === 0 ? (
              <li className="text-white/45">No decisions recorded.</li>
            ) : (
              record.decisions.map((d) => (
                <li key={d.id}>
                  • {d.text}
                  {d.resolution ? (
                    <span className="text-white/45"> — {d.resolution}</span>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-xl border border-white/8 bg-black/20 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Action items
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-white/70">
            {record.actions.length === 0 ? (
              <li className="text-white/45">No actions.</li>
            ) : (
              record.actions.map((a) => (
                <li key={a.id}>
                  • {a.title}
                  <span className="text-white/45">
                    {" "}
                    — {a.owner}, due {a.dueDate}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </article>
  );
}

function BoardDashboard() {
  const impact = useMemo(() => buildBoardImpactIntelligence(), []);
  const approvedPacks = useApprovedPacks();
  const latestPack = useMemo(() => {
    const sorted = [...approvedPacks].sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
    return sorted[0] ?? getTiDemoApprovedBoardPacks()[0];
  }, [approvedPacks]);
  const { snap, boardMeetings } = useBoardGovernanceMeetings();

  const nextMeeting = useMemo(() => {
    const scheduled = boardMeetings
      .filter((m) => m.status === "Scheduled" || m.status === "Draft")
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
    return scheduled[0] ?? null;
  }, [boardMeetings]);

  const minutesRecords = useMemo(
    () => buildTiMinutesFromMeetings(boardMeetings.map(mapGovernanceToTiBoardMeeting)),
    [boardMeetings],
  );
  const latestMinutes = minutesRecords[0] ?? null;

  const [tileLayout, setTileLayout] = useState<BoardDashboardTileId[]>(
    DEFAULT_BOARD_DASHBOARD_TILE_LAYOUT,
  );
  const [tilesHydrated, setTilesHydrated] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  useEffect(() => {
    startTransition(() => {
      const loaded = loadViewTileLayout(
        BOARD_DASHBOARD_TILE_STORAGE_KEY,
        DEFAULT_BOARD_DASHBOARD_TILE_LAYOUT,
      ).filter((id): id is BoardDashboardTileId =>
        (BOARD_DASHBOARD_TILE_IDS as readonly string[]).includes(id),
      );
      setTileLayout(loaded.length ? loaded : [...DEFAULT_BOARD_DASHBOARD_TILE_LAYOUT]);
      setTilesHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!tilesHydrated) return;
    saveViewTileLayout(BOARD_DASHBOARD_TILE_STORAGE_KEY, tileLayout);
  }, [tileLayout, tilesHydrated]);

  function removeTile(id: BoardDashboardTileId) {
    setTileLayout((current) => current.filter((tileId) => tileId !== id));
  }

  function renderTile(id: BoardDashboardTileId) {
    switch (id) {
      case "next-meeting":
        return (
          <Card title="Next board meeting">
            {nextMeeting ? (
              <>
                <p className="text-lg font-semibold text-white">{nextMeeting.title}</p>
                <p className="mt-1 text-sm text-white/60">
                  {formatBoardMeetingDate(nextMeeting.meetingDate)} · {nextMeeting.status}
                </p>
                <ul className="mt-3 space-y-1 text-sm text-white/70">
                  {agendaLinesFromMinutes(nextMeeting.minutes)
                    .slice(0, 4)
                    .map((item) => (
                      <li key={item} className="flex gap-2">
                        <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                        {item}
                      </li>
                    ))}
                </ul>
                <Link
                  href="/board/meetings"
                  className="mt-4 inline-flex text-xs font-semibold text-emerald-200 hover:text-emerald-100"
                >
                  Open Board Meeting →
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-white/50">No scheduled board meeting.</p>
                <Link
                  href="/board/meetings"
                  className="mt-3 inline-flex text-xs font-semibold text-emerald-200 hover:text-emerald-100"
                >
                  Open Board Meetings →
                </Link>
              </>
            )}
          </Card>
        );
      case "latest-pack":
        return (
          <Card title="Latest approved board pack">
            {latestPack ? (
              <>
                <p className="text-lg font-semibold text-white">{latestPack.packName}</p>
                <p className="mt-1 text-sm text-white/60">
                  Meeting {formatBoardMeetingDate(latestPack.meetingDate)} · Generated{" "}
                  {new Date(latestPack.createdAt).toLocaleDateString("en-GB")}
                </p>
                <p className="mt-2 text-xs text-emerald-200/80">Status: Approved (Final)</p>
                <Link
                  href="/board/decks"
                  className="mt-4 inline-flex text-xs font-semibold text-emerald-200 hover:text-emerald-100"
                >
                  Open Board Pack →
                </Link>
              </>
            ) : (
              <p className="text-sm text-white/50">No approved board pack on file.</p>
            )}
          </Card>
        );
      case "minutes-snapshot":
        return (
          <Card title="Minutes & decisions">
            {latestMinutes ? (
              <>
                <p className="text-sm font-semibold text-white">{latestMinutes.title}</p>
                <p className="mt-1 text-xs text-white/45">
                  {formatBoardMeetingDate(latestMinutes.meetingDate)} · {latestMinutes.status}
                </p>
                <p className="mt-2 line-clamp-3 text-sm text-white/65">{latestMinutes.minutesSummary}</p>
                <p className="mt-2 text-xs text-white/40">
                  {latestMinutes.decisions.length} decision(s) · {latestMinutes.actions.length}{" "}
                  action item(s)
                </p>
                <Link
                  href="/board/meetings"
                  className="mt-4 inline-flex text-xs font-semibold text-emerald-200 hover:text-emerald-100"
                >
                  Open Minutes &amp; Decisions →
                </Link>
              </>
            ) : (
              <p className="text-sm text-white/50">No held board meetings with minutes yet.</p>
            )}
          </Card>
        );
      case "risk-heatmap":
        return (
          <Card title="Risk register heat map">
            <BoardDashboardRiskHeatMap />
          </Card>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
            Board Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Governance at a glance
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Next meeting, board pack, minutes, risk posture, and portfolio impact for directors.
          </p>
        </div>
        {tilesHydrated ? (
          <BoardDashboardTileCustomize
            layout={tileLayout}
            onLayoutChange={setTileLayout}
            customizeOpen={customizeOpen}
            onCustomizeOpenChange={setCustomizeOpen}
          />
        ) : null}
      </header>

      {snap.status === "loading" ? (
        <p className="text-sm text-white/50">Loading governance data…</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {tileLayout.map((tileId) => (
          <div key={tileId} className="relative">
            {customizeOpen ? (
              <button
                type="button"
                aria-label={`Remove ${BOARD_DASHBOARD_TILE_LABELS[tileId]}`}
                onClick={() => removeTile(tileId)}
                className="absolute right-3 top-3 z-10 rounded-md border border-white/10 bg-black/40 p-1 text-white/45 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
            {renderTile(tileId)}
          </div>
        ))}
      </div>

      <Card title="Impact snapshot">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-300/70">
              Impact Health Score
            </p>
            <p className="mt-1 text-xl font-semibold text-white">
              {impact.health.score}
              <span className="text-sm text-white/40">/100</span>
            </p>
            <p className="mt-0.5 text-xs text-white/45">{impact.health.band}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Jobs Created</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {impact.summary.jobsCreated.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-white/45">Across portfolio holdings</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">People Served</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {impact.summary.peopleServed.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-white/45">Beneficiaries reached</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Countries Impacted</p>
            <p className="mt-1 text-xl font-semibold text-white">{impact.summary.countriesImpacted}</p>
            <p className="mt-0.5 text-xs text-white/45">Geographic footprint</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col items-start gap-2">
          <Link
            href="/board/impact"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-400/50 hover:bg-emerald-500/15"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Open Impact Intelligence
          </Link>
          <Link
            href="/board/journeys"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-white/25 hover:text-white"
          >
            Open Journey Stories
          </Link>
        </div>
      </Card>

      <BoardMinutesDecisionsPanel latestRecord={latestMinutes} />
    </div>
  );
}

function BoardMinutesDecisionsPanel({ latestRecord }: { latestRecord: TiMinutesRecord | null }) {
  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Minutes &amp; Decisions
        </h2>
        <p className="mt-1 text-sm text-white/55">
          Latest held Talanton board meeting — minutes, resolutions, and action owners.
        </p>
      </div>
      {latestRecord ? (
        <MinutesMeetingSummary record={latestRecord} />
      ) : (
        <p className="text-sm text-white/50">No held board meetings with minutes yet.</p>
      )}
    </section>
  );
}

function BoardMeetings() {
  const snap = useSyncExternalStore(
    subscribeTalantonGovernanceStore,
    getTalantonGovernanceSnapshot,
    getTalantonGovernanceServerSnapshot,
  );
  const sorted = useMemo(
    () =>
      listMeetings({ includeArchived: true })
        .filter((m) => m.meetingType === "Board Meeting")
        .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate)),
    [snap],
  );
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<GovernanceMeeting | null>(null);

  const filtered = q.trim()
    ? sorted.filter((m) => {
        const hay = `${m.title} ${m.minutes} ${m.decisions.map((d) => d.text).join(" ")} ${m.actions
          .map((a) => a.title)
          .join(" ")}`.toLowerCase();
        return hay.includes(q.trim().toLowerCase());
      })
    : sorted;

  const onCreate = useCallback(() => {
    const label = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    void createMeeting({
      meetingType: "Board Meeting",
      title: `Talanton Impact Board — ${label}`,
      status: "Draft",
      minutes: "",
    }).then(setEditing).catch((error) => {
      console.error("[BoardMeetings create]", error);
      window.alert(error instanceof Error ? error.message : "Failed to create meeting.");
    });
  }, []);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Board Meetings</h1>
          <p className="mt-1 text-sm text-white/55">
            Agenda, minutes, decisions, and actions for every board meeting.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-50 hover:bg-emerald-500/30"
        >
          <Plus className="h-3.5 w-3.5" />
          Create meeting
        </button>
      </header>
      {snap.status === "loading" ? (
        <p className="text-sm text-white/50">Loading board meetings…</p>
      ) : null}
      {snap.status === "error" ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {snap.error}
        </p>
      ) : null}
      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search meetings, minutes, decisions, owners…"
          className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-emerald-400/50"
        />
      </label>
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-white/45">No board meetings yet. Create one to get started.</p>
        ) : null}
        {filtered.map((m) => {
          const agenda = agendaLinesFromMinutes(m.minutes);
          return (
            <article
              key={m.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-white">{m.title}</h2>
                  <p className="text-sm text-white/50">{formatBoardMeetingDate(m.meetingDate)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/60">
                    {m.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditing(m)}
                    className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/5"
                  >
                    Edit
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    Agenda
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-white/70">
                    {agenda.map((a) => (
                      <li key={a}>• {a}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    Decisions
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-white/70">
                    {m.decisions.length === 0 ? (
                      <li className="text-white/40">None recorded yet.</li>
                    ) : (
                      m.decisions.map((d) => (
                        <li key={d.id}>
                          • {d.text}{" "}
                          <span className="text-xs text-white/40">({d.status})</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    Actions
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {m.actions.length === 0 ? (
                      <li className="text-sm text-white/40">No actions.</li>
                    ) : (
                      m.actions.map((a) => (
                        <li
                          key={a.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-sm"
                        >
                          <span className="text-white/80">{a.title}</span>
                          <span className="text-xs text-white/45">
                            {a.owner} · {a.dueDate} · {a.status}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                {m.minutes.trim() ? (
                  <div className="md:col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                      Minutes summary
                    </p>
                    <p className="mt-1 line-clamp-4 text-sm text-white/65 whitespace-pre-wrap">
                      {m.minutes}
                    </p>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      {editing ? (
        <TalantonMeetingEditor
          meeting={editing}
          onClose={() => setEditing(null)}
          title={editing.status === "Draft" && !editing.minutes ? "Create board meeting" : "Edit board meeting"}
          saveLabel="Save meeting"
          lockMeetingType="Board Meeting"
        />
      ) : null}
    </div>
  );
}

function BoardDecks() {
  const packs = useApprovedPacks();
  const impactPacks = useMemo(() => impactReportsAsBoardPackRows(), []);
  const combined = useMemo(() => {
    const seen = new Set(packs.map((p) => p.id));
    const extras = impactPacks
      .filter((p) => !seen.has(p.id))
      .map(
        (p): TiBoardPack => ({
          id: p.id,
          packName: p.packName,
          meetingDate: p.meetingDate,
          status: "Final",
          createdAt: p.createdAt,
          pdfOpenUrl: p.pdfOpenUrl,
          pptxDownloadUrl: p.pptxDownloadUrl,
        }),
      );
    return [...extras, ...packs];
  }, [packs, impactPacks]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-white">Board Decks</h1>
        <p className="mt-1 text-sm text-white/55">
          Approved board packs and published Annual Impact Reports. Draft packs are not visible to
          board members.
        </p>
      </header>
      <div className="space-y-3">
        {combined.map((pack) => {
          const impactMeta = impactPacks.find((p) => p.id === pack.id);
          return (
            <article
              key={pack.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{pack.packName}</h2>
                  <p className="mt-1 text-sm text-white/50">
                    {impactMeta
                      ? `Reporting period ${impactMeta.reportingPeriod}`
                      : `Meeting ${pack.meetingDate}`}{" "}
                    · Generated {new Date(pack.createdAt).toLocaleDateString("en-GB")}
                  </p>
                  {impactMeta ? (
                    <p className="mt-2 line-clamp-3 text-sm text-white/60">
                      {impactMeta.executiveSummary}
                    </p>
                  ) : null}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  {impactMeta ? "Impact Report" : "Approved"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={pack.pdfOpenUrl || "#"}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Preview PDF
                </a>
                <a
                  href={pack.pdfOpenUrl || "#"}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </a>
                <a
                  href={pack.pptxDownloadUrl || "#"}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PowerPoint
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

type BoardMemberFormState = {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
};

const EMPTY_MEMBER_FORM: BoardMemberFormState = {
  firstName: "",
  lastName: "",
  role: "",
  email: "",
};

function memberToForm(member: TiBoardMember): BoardMemberFormState {
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    role: member.role,
    email: member.email,
  };
}

function formToMemberInput(form: BoardMemberFormState, existing?: TiBoardMember) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    role: form.role.trim(),
    email: form.email.trim(),
    committees: existing?.committees ?? [],
  };
}

const memberInputClass =
  "w-full rounded-lg border border-emerald-400/20 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50";

function BoardMemberFormModal({
  title,
  initial,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  title: string;
  initial: BoardMemberFormState;
  onCancel: () => void;
  onSubmit: (form: BoardMemberFormState) => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<BoardMemberFormState>(initial);
  const valid =
    form.firstName.trim() && form.lastName.trim() && form.role.trim() && form.email.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <form
        className="flex w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-[#0b1a14] shadow-xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSubmit(form);
        }}
      >
        <div className="border-b border-white/10 px-5 py-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 text-xs text-white/45">Board of Advisors roster details.</p>
        </div>
        <div className="space-y-4 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">
            Member information
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-white/55">First name</span>
              <input
                className={memberInputClass}
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-white/55">Last name</span>
              <input
                className={memberInputClass}
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                required
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-white/55">Role</span>
              <input
                className={memberInputClass}
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="Board Member"
                required
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-white/55">Email</span>
              <input
                type="email"
                className={memberInputClass}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!valid}
            className="rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-500/30 disabled:opacity-50"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

function BoardMembers() {
  const memberState = useSyncExternalStore(
    subscribeBoardMembersStore,
    getBoardMembersState,
    getBoardMembersServerSnapshot,
  );
  const members = memberState.members;
  const [modal, setModal] = useState<"add" | { edit: TiBoardMember } | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
            Governance
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Board Members</h1>
          <p className="mt-1 text-sm text-white/55">
            Board of Advisors roster — add, edit, or remove members.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal("add")}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-50 hover:bg-emerald-500/30"
        >
          <Users className="h-3.5 w-3.5" />
          Add board member
        </button>
      </header>

      {memberState.status === "loading" ? (
        <p className="text-sm text-white/50">Loading board members…</p>
      ) : null}
      {memberState.status === "error" ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {memberState.error}
        </p>
      ) : null}
      {memberError ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {memberError}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((m) => (
          <article
            key={m.id}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f2a1f]/40 via-[#0b1a14]/90 to-[#08110d] p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/15 text-sm font-semibold text-emerald-100">
                {m.firstName.charAt(0)}
                {m.lastName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{m.name}</p>
                <p className="mt-0.5 text-sm text-emerald-200/70">{m.role}</p>
                <a
                  href={`mailto:${m.email}`}
                  className="mt-2 block truncate text-xs text-white/45 hover:text-white/70"
                >
                  {m.email}
                </a>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setModal({ edit: m })}
                    className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/5"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm(`Remove ${m.name} from the board roster?`)) return;
                      setMemberError(null);
                      void removeMember(m.id).catch((error) => {
                        setMemberError(
                          error instanceof Error ? error.message : "Failed to remove member.",
                        );
                      });
                    }}
                    className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-200 hover:bg-rose-500/20"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
        {members.length === 0 ? (
          <p className="text-sm text-white/45 sm:col-span-2">No board members yet.</p>
        ) : null}
      </div>

      {modal === "add" ? (
        <BoardMemberFormModal
          title="Add board member"
          initial={EMPTY_MEMBER_FORM}
          submitLabel="Add member"
          onCancel={() => setModal(null)}
          onSubmit={(form) => {
            setMemberError(null);
            void addMember(formToMemberInput(form))
              .then(() => setModal(null))
              .catch((error) => {
                setMemberError(error instanceof Error ? error.message : "Failed to add member.");
              });
          }}
        />
      ) : null}
      {modal && modal !== "add" ? (
        <BoardMemberFormModal
          title="Edit board member"
          initial={memberToForm(modal.edit)}
          submitLabel="Save changes"
          onCancel={() => setModal(null)}
          onSubmit={(form) => {
            setMemberError(null);
            void updateMember(modal.edit.id, formToMemberInput(form, modal.edit))
              .then(() => setModal(null))
              .catch((error) => {
                setMemberError(error instanceof Error ? error.message : "Failed to save member.");
              });
          }}
        />
      ) : null}
    </div>
  );
}

export function TalantonBoardPortalApp({ section }: Props) {
  if (section === "meetings") return <BoardMeetings />;
  if (section === "decks") return <BoardDecks />;
  if (section === "risk") return <TalantonRiskRegisterWorkspace />;
  if (section === "impact") return <BoardImpactIntelligencePage />;
  if (section === "journeys") return <BoardJourneyStoriesPage />;
  if (section === "members") return <BoardMembers />;
  return <BoardDashboard />;
}
