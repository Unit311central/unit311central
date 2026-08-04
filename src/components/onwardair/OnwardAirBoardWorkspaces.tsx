"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Search,
  Sparkles,
} from "lucide-react";

import {
  OA_BOARD_DECKS,
  OA_UPCOMING_BOARD_MEETINGS,
  buildOaBoardMinutes,
  createAiBoardMeetingDeckDraft,
  getOaBoardDashboardSnapshot,
  type OaBoardDeck,
} from "@/lib/onwardair/board-data";
import { cn } from "@/lib/utils";
import {
  CorporateKpiTile,
  CorporateSection,
  CorporateStatusPill,
  corporatePrimaryButtonClass,
  corporateSecondaryButtonClass,
} from "@/components/testflighthub/corporate-ui";

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
        OnwardAir · Board
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h1>
      <p className="mt-1 text-sm text-white/55">{subtitle}</p>
    </header>
  );
}

export function OnwardAirBoardDashboardWorkspace() {
  const snap = useMemo(() => getOaBoardDashboardSnapshot(), []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        subtitle="Next meeting, approved decks, open actions, risks, and recent decisions for OnwardAir."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Next board meeting">
          <p className="text-lg font-semibold text-white">{snap.nextMeeting.title}</p>
          <p className="mt-1 text-sm text-white/60">
            {formatDate(snap.nextMeeting.meetingDate)} · {snap.nextMeeting.status}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-white/70">
            {snap.nextMeeting.agenda.slice(0, 4).map((item) => (
              <li key={item} className="flex gap-2">
                <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Latest approved board deck">
          <p className="text-lg font-semibold text-white">
            {snap.latestApprovedPack.packName}
          </p>
          <p className="mt-1 text-sm text-white/60">
            Meeting {formatDate(snap.latestApprovedPack.meetingDate)} · Generated{" "}
            {new Date(snap.latestApprovedPack.createdAt).toLocaleDateString("en-US")}
          </p>
          <p className="mt-2 text-xs text-emerald-200/80">Status: Approved (Final)</p>
        </Card>

        <Card title="Open board actions">
          <ul className="space-y-2">
            {snap.openActions.length === 0 ? (
              <li className="text-sm text-white/50">No open actions.</li>
            ) : (
              snap.openActions.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm"
                >
                  <p className="text-white/90">{a.title}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {a.owner} · due {formatDate(a.dueDate)} · {a.status}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card title="High risks">
          <ul className="space-y-2">
            {snap.highRisks.map((r) => (
              <li
                key={r.id}
                className="flex gap-2 rounded-xl border border-rose-400/20 bg-rose-500/5 px-3 py-2 text-sm"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                <div>
                  <p className="text-white/90">{r.description}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {r.id} · Impact {r.impact} · {r.owner} · {r.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Financial snapshot" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {snap.financialSnapshot.map((f) => (
              <div key={f.label} className="rounded-xl border border-white/8 bg-black/20 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{f.label}</p>
                <p className="mt-1 text-xl font-semibold text-white">{f.value}</p>
                <p className="mt-0.5 text-xs text-white/45">{f.hint}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Strategic discussion topics">
          <ul className="space-y-1.5 text-sm text-white/75">
            {snap.strategicTopics.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                {t}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Recent decisions">
          <ul className="space-y-2">
            {snap.recentDecisions.map((d) => (
              <li key={d.id} className="text-sm">
                <p className="text-white/85">{d.text}</p>
                {d.resolution ? (
                  <p className="mt-0.5 text-xs text-emerald-200/70">{d.resolution}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export function OnwardAirBoardMeetingsWorkspace() {
  const meetings = OA_UPCOMING_BOARD_MEETINGS;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Board Meetings"
        subtitle="Quarterly OnwardAir board cadence — September 2026, then every three months."
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <CorporateKpiTile label="Upcoming" value={meetings.length} hint="Scheduled meetings" />
        <CorporateKpiTile
          label="Next"
          value={formatDate(meetings[0]!.meetingDate)}
          hint={meetings[0]!.title}
        />
        <CorporateKpiTile label="Cadence" value="Quarterly" hint="Every 3 months" />
      </section>

      <div className="space-y-3">
        {meetings.map((m) => (
          <article
            key={m.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-white">{m.title}</h2>
                <p className="text-sm text-white/50">{formatDate(m.meetingDate)}</p>
              </div>
              <CorporateStatusPill className="border-sky-400/30 bg-sky-500/15 text-sky-100">
                {m.status}
              </CorporateStatusPill>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Agenda
                </p>
                <ul className="mt-1 space-y-1 text-sm text-white/70">
                  {m.agenda.map((a) => (
                    <li key={a}>• {a}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Attendees
                </p>
                <ul className="mt-1 space-y-1 text-sm text-white/70">
                  {m.attendees.slice(0, 5).map((a) => (
                    <li key={a.name}>
                      • {a.name}
                      {a.role ? <span className="text-white/40"> — {a.role}</span> : null}
                    </li>
                  ))}
                  {m.attendees.length > 5 ? (
                    <li className="text-white/40">+ {m.attendees.length - 5} more</li>
                  ) : null}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function OnwardAirBoardDecksWorkspace() {
  const [decks, setDecks] = useState<OaBoardDeck[]>(() => [...OA_BOARD_DECKS]);
  const [message, setMessage] = useState<string | null>(null);

  function handleAiCreate() {
    const draft = createAiBoardMeetingDeckDraft(decks);
    setDecks((prev) => [draft, ...prev]);
    setMessage(`Created AI draft for ${draft.packName}. Review and finalise before the board meeting.`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Board Decks"
          subtitle="Approved quarterly board decks for OnwardAir. Generate the next meeting deck with AI."
        />
        <button
          type="button"
          className={cn(corporatePrimaryButtonClass(), "shrink-0")}
          onClick={handleAiCreate}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI CREATE BOARD MEETING DECK
        </button>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}

      <div className="space-y-3">
        {decks.map((pack) => (
          <article
            key={pack.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">{pack.packName}</h2>
                <p className="mt-1 text-sm text-white/50">
                  {pack.quarter} · Meeting {formatDate(pack.meetingDate)} · Generated{" "}
                  {new Date(pack.createdAt).toLocaleDateString("en-US")}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase",
                  pack.status === "Approved"
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                    : "border-amber-400/30 bg-amber-500/10 text-amber-100",
                )}
              >
                {pack.status === "Approved" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {pack.status}
              </span>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2 text-xs text-white/50">
              {pack.pageSummaries.map((s) => (
                <li key={s} className="rounded-full border border-white/10 px-2 py-1">
                  {s}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={pack.pdfOpenUrl}
                className={cn(corporateSecondaryButtonClass(), "text-xs")}
              >
                <FileText className="h-3.5 w-3.5" />
                Preview PDF
              </a>
              <a
                href={pack.pdfOpenUrl}
                className={cn(corporateSecondaryButtonClass(), "text-xs")}
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </a>
              <a
                href={pack.pptxDownloadUrl}
                className={cn(corporateSecondaryButtonClass(), "text-xs")}
              >
                <Download className="h-3.5 w-3.5" />
                Download PowerPoint
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/** Minutes & Decisions — structure view for three OnwardAir held meetings. */
export function OnwardAirBoardMinutesWorkspace() {
  const records = useMemo(() => buildOaBoardMinutes(), []);
  const [q, setQ] = useState("");
  const filtered = records.filter((r) => {
    const hay =
      `${r.title} ${r.minutesSummary} ${r.decisions.map((d) => d.text).join(" ")} ${r.resolutions.join(" ")} ${r.actions.map((a) => `${a.owner} ${a.title}`).join(" ")}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Minutes & Decisions"
        subtitle="Structured minutes for OnwardAir board meetings — decisions, resolutions, and action owners."
      />

      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search minutes, decisions, owners…"
          className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-sky-400/50"
        />
      </label>

      <CorporateSection
        title="Meeting minutes"
        subtitle="Structure view — one card per held OnwardAir board meeting."
      >
        <div className="space-y-3">
          {filtered.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-white">{r.title}</h2>
                  <p className="text-sm text-white/45">{formatDate(r.meetingDate)}</p>
                </div>
                <CorporateStatusPill className="border-emerald-400/30 bg-emerald-500/15 text-emerald-100">
                  {r.status}
                </CorporateStatusPill>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{r.minutesSummary}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white/8 bg-black/20 px-3.5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    Decisions / resolutions
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-white/70">
                    {r.decisions.map((d) => (
                      <li key={d.id}>
                        • {d.text}
                        {d.resolution ? (
                          <span className="text-white/45"> — {d.resolution}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-white/8 bg-black/20 px-3.5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    Action owners
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-white/70">
                    {r.actions.map((a) => (
                      <li key={a.id}>
                        • {a.owner}: {a.title}{" "}
                        <span className="text-white/40">
                          (due {formatDate(a.dueDate)}, {a.status})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
          {filtered.length === 0 ? (
            <p className="text-sm text-white/45">No minutes match your search.</p>
          ) : null}
        </div>
      </CorporateSection>
    </div>
  );
}
