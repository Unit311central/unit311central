"use client";

import { useMemo, useState } from "react";
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
import {
  TI_BOARD_MEETINGS,
  TI_BOARD_MEMBERS,
  TI_BOARD_RISKS,
  buildTiMinutesFromMeetings,
  getTiBoardDashboardSnapshot,
  getTiDemoApprovedBoardPacks,
  type TiBoardPortalSection,
} from "@/lib/talanton/board-portal-data";
import { buildBoardImpactIntelligence } from "@/lib/talanton/board-impact-intelligence";
import { cn } from "@/lib/utils";

type Props = {
  section: TiBoardPortalSection;
};

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
          Next meeting, approved packs, actions, risks, impact, and recent decisions.
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

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-white">Board Meetings</h1>
        <p className="mt-1 text-sm text-white/55">Agenda, minutes, actions, and decisions.</p>
      </header>
      <div className="space-y-3">
        {sorted.map((m) => (
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
              {m.notes ? (
                <div className="md:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    Minutes notes
                  </p>
                  <p className="mt-1 text-sm text-white/65">{m.notes}</p>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function BoardDecks() {
  const packs = getTiDemoApprovedBoardPacks();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-white">Board Decks</h1>
        <p className="mt-1 text-sm text-white/55">
          Approved board packs only. Draft packs are not visible to board members.
        </p>
      </header>
      <div className="space-y-3">
        {packs.map((pack) => (
          <article
            key={pack.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">{pack.packName}</h2>
                <p className="mt-1 text-sm text-white/50">
                  Meeting {pack.meetingDate} · Generated{" "}
                  {new Date(pack.createdAt).toLocaleDateString("en-GB")}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                Approved
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
        ))}
      </div>
    </div>
  );
}

function BoardMinutes() {
  const records = buildTiMinutesFromMeetings();
  const [q, setQ] = useState("");
  const filtered = records.filter((r) => {
    const hay =
      `${r.title} ${r.minutesSummary} ${r.decisions.map((d) => d.text).join(" ")} ${r.resolutions.join(" ")}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-white">Minutes & Decisions</h1>
        <p className="mt-1 text-sm text-white/55">
          Search historical minutes, resolutions, decisions, and action owners.
        </p>
      </header>
      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search minutes, decisions, owners…"
          className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-emerald-400/50"
        />
      </label>
      <div className="space-y-3">
        {filtered.map((r) => (
          <article
            key={r.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
          >
            <h2 className="text-lg font-semibold text-white">{r.title}</h2>
            <p className="text-sm text-white/45">{r.meetingDate}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{r.minutesSummary}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Decisions / resolutions
                </p>
                <ul className="mt-1 space-y-1 text-sm text-white/70">
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
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Action owners
                </p>
                <ul className="mt-1 space-y-1 text-sm text-white/70">
                  {r.actions.map((a) => (
                    <li key={a.id}>
                      • {a.owner}: {a.title}{" "}
                      <span className="text-white/40">
                        (due {a.dueDate}, {a.status})
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

function BoardMembers() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-white">Board Members</h1>
        <p className="mt-1 text-sm text-white/55">
          Board of Advisors · from talantonimpact.com/about/our-team
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {TI_BOARD_MEMBERS.map((m) => (
          <article
            key={m.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-white">{m.name}</p>
                <p className="text-sm text-white/55">{m.role}</p>
                <p className="mt-1 text-xs text-white/45">{m.email}</p>
                <p className="mt-2 text-xs text-white/50">
                  Committees: {m.committees.join(", ")}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function TalantonBoardPortalApp({ section }: Props) {
  if (section === "meetings") return <BoardMeetings />;
  if (section === "decks") return <BoardDecks />;
  if (section === "minutes") return <BoardMinutes />;
  if (section === "risk") return <BoardRisk />;
  if (section === "impact") return <BoardImpactIntelligencePage />;
  if (section === "members") return <BoardMembers />;
  return <BoardDashboard />;
}
