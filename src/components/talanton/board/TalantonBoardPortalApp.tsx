"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import BoardImpactIntelligencePage from "@/components/talanton/board/BoardImpactIntelligencePage";
import BoardJourneyStoriesPage from "@/components/talanton/board/BoardJourneyStoriesPage";
import { loadAbhiBoardPacks } from "@/lib/abhi/board-pack-record";
import {
  TI_BOARD_MEETINGS,
  TI_BOARD_RISKS,
  buildTiMinutesFromMeetings,
  getTiBoardDashboardSnapshot,
  getTiDemoApprovedBoardPacks,
  type TiBoardMember,
  type TiBoardPack,
  type TiBoardPortalSection,
} from "@/lib/talanton/board-portal-data";
import {
  addMember,
  listMembers,
  removeMember,
  subscribeBoardMembersStore,
  updateMember,
} from "@/lib/talanton/board-members-store";
import { buildBoardFundSummary } from "@/lib/talanton/funds-data";
import { buildBoardImpactIntelligence } from "@/lib/talanton/board-impact-intelligence";
import {
  listJourneyStoriesForBoard,
  listJourneyStoriesForInvestors,
} from "@/lib/talanton/journey-stories-store";
import {
  impactReportsAsBoardPackRows,
  listImpactReportsForBoard,
  periodLabel,
} from "@/lib/talanton/annual-impact-report-store";
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

function BoardDashboard() {
  const snap = useMemo(() => getTiBoardDashboardSnapshot(), []);
  const impact = useMemo(() => buildBoardImpactIntelligence(), []);
  const journeys = useMemo(() => listJourneyStoriesForBoard().slice(0, 4), []);
  const investorJourneys = useMemo(
    () => listJourneyStoriesForInvestors().slice(0, 4),
    [],
  );
  const impactReports = useMemo(() => listImpactReportsForBoard().slice(0, 3), []);
  const funds = useMemo(() => buildBoardFundSummary(), []);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
          Board Dashboard
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Governance at a glance
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Next meeting, fund stewardship, investor communications, impact, and recent decisions.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Next board meeting">
          {snap.nextMeeting ? (
            <div>
              <p className="text-lg font-semibold text-white">{snap.nextMeeting.title}</p>
              <p className="mt-1 text-sm text-white/60">
                {snap.nextMeeting.meetingDate} · {snap.nextMeeting.status}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-white/70">
                {snap.nextMeeting.agenda.slice(0, 4).map((item) => (
                  <li key={item} className="flex gap-2">
                    <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-white/50">No scheduled meeting.</p>
          )}
        </Card>

        <Card title="Latest approved board pack">
          <p className="text-lg font-semibold text-white">{snap.latestApprovedPack.packName}</p>
          <p className="mt-1 text-sm text-white/60">
            Meeting {snap.latestApprovedPack.meetingDate} · Generated{" "}
            {new Date(snap.latestApprovedPack.createdAt).toLocaleDateString("en-GB")}
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
                    {a.owner} · due {a.dueDate} · {a.status}
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

        <Card title="Fund Summary" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-3">
            {funds.fundCards.map((f) => (
              <div
                key={f.id}
                className="rounded-xl border border-white/8 bg-black/20 px-3 py-3"
              >
                <p className="text-sm font-semibold text-white">{f.name}</p>
                <p className="mt-2 text-[11px] text-white/45">Fund size · {f.size}</p>
                <p className="text-[11px] text-white/45">Deployed · {f.deployed}</p>
                <p className="text-[11px] text-white/45">
                  {f.companies} portfolio companies · {f.deploymentPct}% deployed
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Capital Overview" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {funds.capitalOverview.map((f) => (
              <div key={f.label} className="rounded-xl border border-white/8 bg-black/20 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{f.label}</p>
                <p className="mt-1 text-xl font-semibold text-white">{f.value}</p>
                <p className="mt-0.5 text-xs text-white/45">{f.hint}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Investor Summary">
          <div className="grid gap-3 sm:grid-cols-2">
            {funds.investorSummary.map((f) => (
              <div key={f.label} className="rounded-xl border border-white/8 bg-black/20 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{f.label}</p>
                <p className="mt-1 text-xl font-semibold text-white">{f.value}</p>
                <p className="mt-0.5 text-xs text-white/45">{f.hint}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent Investor Communications">
          <ul className="space-y-2">
            {funds.recentCommunications.map((c) => (
              <li key={c.id} className="rounded-xl border border-white/8 bg-black/20 px-3 py-2">
                <p className="text-sm text-white/90">{c.subject}</p>
                <p className="mt-1 text-xs text-white/45">
                  {c.date} · {c.channel} · {c.investor} ({c.organisation})
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Impact snapshot" className="lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">
                  Countries Impacted
                </p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {impact.summary.countriesImpacted}
                </p>
                <p className="mt-0.5 text-xs text-white/45">Geographic footprint</p>
              </div>
            </div>
            <Link
              href="/board/impact"
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-400/50 hover:bg-emerald-500/15"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Open Impact Intelligence
            </Link>
          </div>
        </Card>

        <Card title="Latest Impact Reports" className="lg:col-span-2">
          <ul className="space-y-3">
            {impactReports.length === 0 ? (
              <li className="text-sm text-white/50">No published impact reports yet.</li>
            ) : (
              impactReports.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-white/8 bg-black/20 px-3 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{r.title}</p>
                    <span className="text-[10px] uppercase tracking-wide text-white/40">
                      {periodLabel(r.period)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-3 text-xs text-white/55">
                    {r.summaries.executiveSummary}
                  </p>
                </li>
              ))
            )}
          </ul>
          <Link
            href="/board/decks"
            className="mt-3 inline-flex text-xs font-semibold text-emerald-200 hover:text-emerald-100"
          >
            Open Board Decks →
          </Link>
        </Card>

        <Card title="Related Journey Stories" className="lg:col-span-2">
          <ul className="space-y-3">
            {(investorJourneys.length > 0 ? investorJourneys : journeys).map((j) => (
              <li
                key={j.id}
                className="rounded-xl border border-white/8 bg-black/20 px-3 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{j.title}</p>
                  <span className="text-[10px] uppercase tracking-wide text-white/40">
                    {j.country} · {j.startDate}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-white/55">
                  {j.generated.executiveSummary}
                </p>
              </li>
            ))}
          </ul>
          <Link
            href="/board/journeys"
            className="mt-3 inline-flex text-xs font-semibold text-emerald-200 hover:text-emerald-100"
          >
            Open Journey Stories →
          </Link>
        </Card>

        <Card title="Strategic discussion topics">
          <ul className="space-y-1.5 text-sm text-white/75">
            {snap.strategicTopics.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
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

function BoardMeetings() {
  const sorted = [...TI_BOARD_MEETINGS].sort((a, b) =>
    b.meetingDate.localeCompare(a.meetingDate),
  );
  const minutesByMeetingId = useMemo(() => {
    const records = buildTiMinutesFromMeetings();
    return new Map(records.map((r) => [r.meetingId, r]));
  }, []);
  const [q, setQ] = useState("");
  const filtered = q.trim()
    ? sorted.filter((m) => {
        const minutes = minutesByMeetingId.get(m.id);
        const hay = `${m.title} ${minutes?.minutesSummary ?? ""} ${m.decisions
          .map((d) => d.text)
          .join(" ")} ${m.resolutions.join(" ")}`.toLowerCase();
        return hay.includes(q.trim().toLowerCase());
      })
    : sorted;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-white">Board Meetings</h1>
        <p className="mt-1 text-sm text-white/55">
          Agenda, minutes, decisions, and actions for every board meeting.
        </p>
      </header>
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
        {filtered.map((m) => {
          const minutes = minutesByMeetingId.get(m.id);
          return (
          <article
            key={m.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-white">{m.title}</h2>
                <p className="text-sm text-white/50">{m.meetingDate}</p>
              </div>
              <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/60">
                {m.status}
              </span>
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
                  Decisions
                </p>
                <ul className="mt-1 space-y-1 text-sm text-white/70">
                  {m.decisions.length === 0 ? (
                    <li className="text-white/40">None recorded yet.</li>
                  ) : (
                    m.decisions.map((d) => <li key={d.id}>• {d.text}</li>)
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
              {minutes ? (
                <div className="md:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    Minutes summary
                  </p>
                  <p className="mt-1 text-sm text-white/65">{minutes.minutesSummary}</p>
                  {minutes.resolutions.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-white/70">
                      {minutes.resolutions.map((resolution, idx) => (
                        <li key={`${m.id}-res-${idx}`}>• {resolution}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : m.notes ? (
                <div className="md:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    Minutes notes
                  </p>
                  <p className="mt-1 text-sm text-white/65">{m.notes}</p>
                </div>
              ) : null}
            </div>
          </article>
          );
        })}
      </div>
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

function BoardRisk() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-white">Risk Register</h1>
        <p className="mt-1 text-sm text-white/55">Read-only board view.</p>
      </header>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.14em] text-white/40">
            <tr>
              <th className="px-3 py-3">Risk</th>
              <th className="px-3 py-3">Impact</th>
              <th className="px-3 py-3">Likelihood</th>
              <th className="px-3 py-3">Owner</th>
              <th className="px-3 py-3">Mitigation</th>
              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {TI_BOARD_RISKS.map((r) => (
              <tr key={r.id} className="border-t border-white/8 text-white/75">
                <td className="px-3 py-3">
                  <p className="font-medium text-white/90">{r.id}</p>
                  <p className="mt-0.5 max-w-xs text-xs text-white/55">{r.description}</p>
                </td>
                <td className="px-3 py-3">{r.impact}</td>
                <td className="px-3 py-3">{r.likelihood}</td>
                <td className="px-3 py-3">{r.owner}</td>
                <td className="px-3 py-3 max-w-xs text-xs text-white/55">{r.mitigation}</td>
                <td className="px-3 py-3">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type BoardMemberFormState = {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  committees: string;
};

const EMPTY_MEMBER_FORM: BoardMemberFormState = {
  firstName: "",
  lastName: "",
  role: "",
  email: "",
  committees: "",
};

function memberToForm(member: TiBoardMember): BoardMemberFormState {
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    role: member.role,
    email: member.email,
    committees: member.committees.join(", "),
  };
}

function formToMemberInput(form: BoardMemberFormState) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    role: form.role.trim(),
    email: form.email.trim(),
    committees: form.committees
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
  };
}

const memberInputClass =
  "w-full rounded-lg border border-emerald-400/20 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50";

function BoardMemberForm({
  initial,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  initial: BoardMemberFormState;
  onCancel: () => void;
  onSubmit: (form: BoardMemberFormState) => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<BoardMemberFormState>(initial);
  const valid = form.firstName.trim() && form.lastName.trim() && form.role.trim() && form.email.trim();

  return (
    <form
      className="space-y-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit(form);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-emerald-300/80">
            First name
          </span>
          <input
            className={memberInputClass}
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-emerald-300/80">
            Last name
          </span>
          <input
            className={memberInputClass}
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-emerald-300/80">
            Role
          </span>
          <input
            className={memberInputClass}
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            placeholder="Board Member"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-emerald-300/80">
            Email
          </span>
          <input
            type="email"
            className={memberInputClass}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-emerald-300/80">
            Committees (comma separated)
          </span>
          <input
            className={memberInputClass}
            value={form.committees}
            onChange={(e) => setForm((f) => ({ ...f, committees: e.target.value }))}
            placeholder="Board, Investment Committee"
          />
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!valid}
          className="rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-50 hover:bg-emerald-500/30 disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function BoardMembers() {
  const members = useSyncExternalStore(
    subscribeBoardMembersStore,
    listMembers,
    listMembers,
  );
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Board Members</h1>
          <p className="mt-1 text-sm text-white/55">
            Board of Advisors roster — add, edit, or remove board members.
          </p>
        </div>
        {!adding ? (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setAdding(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-50 hover:bg-emerald-500/30"
          >
            <Users className="h-3.5 w-3.5" />
            Add board member
          </button>
        ) : null}
      </header>

      {adding ? (
        <BoardMemberForm
          initial={EMPTY_MEMBER_FORM}
          submitLabel="Add member"
          onCancel={() => setAdding(false)}
          onSubmit={(form) => {
            addMember(formToMemberInput(form));
            setAdding(false);
          }}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {members.map((m) =>
          editingId === m.id ? (
            <div key={m.id} className="sm:col-span-2">
              <BoardMemberForm
                initial={memberToForm(m)}
                submitLabel="Save changes"
                onCancel={() => setEditingId(null)}
                onSubmit={(form) => {
                  updateMember(m.id, formToMemberInput(form));
                  setEditingId(null);
                }}
              />
            </div>
          ) : (
            <article
              key={m.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white">{m.name}</p>
                      <p className="text-sm text-white/55">{m.role}</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAdding(false);
                          setEditingId(m.id);
                        }}
                        className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/5"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMember(m.id)}
                        className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-200 hover:bg-rose-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-white/45">{m.email}</p>
                  <p className="mt-2 text-xs text-white/50">
                    Committees: {m.committees.length ? m.committees.join(", ") : "—"}
                  </p>
                </div>
              </div>
            </article>
          ),
        )}
        {members.length === 0 ? (
          <p className="text-sm text-white/45">No board members yet.</p>
        ) : null}
      </div>
    </div>
  );
}

export function TalantonBoardPortalApp({ section }: Props) {
  if (section === "meetings") return <BoardMeetings />;
  if (section === "decks") return <BoardDecks />;
  if (section === "risk") return <BoardRisk />;
  if (section === "impact") return <BoardImpactIntelligencePage />;
  if (section === "journeys") return <BoardJourneyStoriesPage />;
  if (section === "members") return <BoardMembers />;
  return <BoardDashboard />;
}
