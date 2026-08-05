"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import {
  COMPETITOR_FILTERS,
  filterCompetitors,
  getCompetitor,
  listCompetitors,
  listPriorityWatchCompetitors,
  searchCompetitors,
  sortCompetitors,
  type CompetitorProfile,
  type CompetitorSortKey,
} from "@/lib/onwardair/competitor-intelligence-data";
import {
  ensureWeeklyCompetitorIntelligenceRefresh,
  getCompetitorIntelCadence,
  markAllCompetitorIntelRead,
  markCompetitorIntelRead,
  type CompetitorIntelItem,
} from "@/lib/onwardair/competitor-intelligence-feed-store";
import { cn } from "@/lib/utils";
import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { useCompetitorIntelFeed } from "./useCompetitorIntelFeed";

const SKY = "#0EA5E9";

function certificationTone(category: CompetitorProfile["certificationCategory"]) {
  switch (category) {
    case "Certified / In Production":
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
    case "In Certification":
      return "border-sky-400/30 bg-sky-500/15 text-sky-200";
    case "Certification Target":
      return "border-amber-400/30 bg-amber-500/15 text-amber-200";
    case "Wound Down / IP Acquired":
      return "border-rose-400/30 bg-rose-500/15 text-rose-200";
    default:
      return "border-white/15 bg-white/10 text-white/60";
  }
}

function Field({ value }: { value: string }) {
  return <span className={value ? "text-white/75" : "text-white/30"}>{value || "—"}</span>;
}

export function OnwardAirCompetitorIntelligenceWorkspace() {
  const searchParams = useSearchParams();
  const competitorId = searchParams.get("competitorId");
  const detail = competitorId ? getCompetitor(competitorId) : null;

  if (detail) {
    return <CompetitorDetail competitor={detail} />;
  }

  return <CompetitorHome />;
}

function CompetitorHome() {
  const router = useRouter();
  const basePath = useInternalOperationsBasePath();
  const feedState = useCompetitorIntelFeed();
  const priority = useMemo(() => listPriorityWatchCompetitors(), []);
  const [landscapeOpen, setLandscapeOpen] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  useEffect(() => {
    ensureWeeklyCompetitorIntelligenceRefresh();
  }, []);

  const cadence = getCompetitorIntelCadence();
  const weekSignals = useMemo(() => {
    const weekKey = cadence.currentWeekKey;
    return feedState.items
      .filter((i) => i.weekKey === weekKey)
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
      .slice(0, 3);
  }, [feedState.items, cadence.currentWeekKey]);

  function openCompetitor(id: string) {
    router.push(
      getInternalNavHref("oa-competitor-intelligence", basePath, { competitorId: id }),
    );
  }

  function refreshFeed() {
    const result = ensureWeeklyCompetitorIntelligenceRefresh({ force: true });
    setRefreshNotice(
      result.created
        ? `Signals refreshed for ${result.weekKey}.`
        : `Already current for ${result.weekKey}.`,
    );
    window.setTimeout(() => setRefreshNotice(null), 3000);
  }

  return (
    <div className="space-y-5 p-1">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/85">
              OnwardAir Intelligence
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              Competitor Intelligence
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">
              Public certification and programme signals, organised for review. Source material
              only — not guidance.
            </p>
          </div>
          <button
            type="button"
            onClick={refreshFeed}
            className="inline-flex min-h-11 touch-manipulation items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/[0.08] sm:min-h-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
        <p className="mt-3 text-xs text-white/40">
          Week {cadence.currentWeekKey}
          {cadence.lastEnsuredAt
            ? ` · updated ${new Date(cadence.lastEnsuredAt).toLocaleString("en-GB")}`
            : ""}
          {" · "}
          next {cadence.nextRefreshLabel}
        </p>
        {refreshNotice ? (
          <p className="mt-2 text-xs font-medium text-emerald-300/90">{refreshNotice}</p>
        ) : null}
      </header>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white">This week</h2>
            <p className="mt-0.5 text-xs text-white/45">Up to three public signals · mark when reviewed</p>
          </div>
          {weekSignals.some((i) => !i.read) ? (
            <button
              type="button"
              onClick={markAllCompetitorIntelRead}
              className="text-[11px] font-medium text-white/50 hover:text-white/80"
            >
              Mark all reviewed
            </button>
          ) : null}
        </div>

        <div className="mt-4 space-y-2.5">
          {weekSignals.map((item) => (
            <SignalRow
              key={item.id}
              item={item}
              onOpen={() => {
                markCompetitorIntelRead(item.id);
                if (item.competitorId) openCompetitor(item.competitorId);
              }}
              onMarkRead={() => markCompetitorIntelRead(item.id)}
            />
          ))}
          {weekSignals.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">No signals for this week yet.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">Priority watch</h2>
        <p className="mt-0.5 text-xs text-white/45">
          Shortlist of programmes often cited in public AAM / VTOL certification coverage
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {priority.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => openCompetitor(c.id)}
              className="rounded-xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-sky-400/30 hover:bg-sky-500/[0.06]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-white">{c.companyName}</span>
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    certificationTone(c.certificationCategory),
                  )}
                >
                  {c.certificationCategory}
                </span>
              </div>
              <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <dt className="text-white/40">Authority</dt>
                  <dd className="mt-0.5 text-white/80">{c.certAuthority || "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Mission</dt>
                  <dd className="mt-0.5 text-white/80">{c.missionFocus}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-white/40">Public status</dt>
                  <dd className="mt-0.5 text-white/80">
                    {c.certificationStatus || c.certificationCategory}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-white/40">Next public milestone</dt>
                  <dd className="mt-0.5 text-white/80">{c.nextCertMilestone || "—"}</dd>
                </div>
              </dl>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03]">
        <button
          type="button"
          onClick={() => setLandscapeOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
        >
          <div>
            <h2 className="text-sm font-semibold text-white">Full landscape</h2>
            <p className="mt-0.5 text-xs text-white/45">
              {listCompetitors().length} tracked programmes · optional deep dive
            </p>
          </div>
          {landscapeOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-white/50" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-white/50" />
          )}
        </button>
        {landscapeOpen ? <LandscapeTable onOpen={openCompetitor} /> : null}
      </section>
    </div>
  );
}

function SignalRow({
  item,
  onOpen,
  onMarkRead,
}: {
  item: CompetitorIntelItem;
  onOpen: () => void;
  onMarkRead: () => void;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border px-4 py-3",
        item.read ? "border-white/10 bg-black/15" : "border-white/15 bg-white/[0.04]",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/12 bg-black/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
          {item.category}
        </span>
        {!item.read ? (
          <span className="text-[10px] font-medium uppercase tracking-wide text-sky-300/80">
            Unreviewed
          </span>
        ) : null}
      </div>
      <h3 className="mt-2 text-sm font-medium text-white">{item.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-white/60">{item.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.competitorId ? (
          <button
            type="button"
            onClick={onOpen}
            className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/75 hover:bg-white/[0.08]"
          >
            Open {item.competitorName ?? "profile"}
          </button>
        ) : null}
        {!item.read ? (
          <button
            type="button"
            onClick={onMarkRead}
            className="rounded-full border border-transparent px-2.5 py-1 text-[11px] text-white/45 hover:text-white/70"
          >
            Mark reviewed
          </button>
        ) : null}
        <span className="self-center text-[10px] text-white/30">{item.sourceLabel}</span>
      </div>
    </article>
  );
}

function LandscapeTable({ onOpen }: { onOpen: (id: string) => void }) {
  const competitors = useMemo(() => listCompetitors(), []);
  const [query, setQuery] = useState("");
  const [missionFocus, setMissionFocus] = useState("");
  const [certCategory, setCertCategory] = useState("");
  const [sortKey, setSortKey] = useState<CompetitorSortKey>("certificationCategory");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const rows = useMemo(() => {
    let list = query.trim() ? searchCompetitors(query) : competitors;
    list = filterCompetitors(list, {
      missionFocus: missionFocus || undefined,
      certificationCategory: certCategory || undefined,
    });
    return sortCompetitors(list, sortKey, sortDir);
  }, [competitors, query, missionFocus, certCategory, sortKey, sortDir]);

  function toggleSort(key: CompetitorSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="border-t border-white/10 px-4 pb-4 sm:px-5">
      <div className="flex flex-col gap-3 pt-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-lg border border-white/15 bg-black/30 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-sky-400/50 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip label="All missions" active={missionFocus === ""} onClick={() => setMissionFocus("")} />
          {COMPETITOR_FILTERS.missionFocuses.map((m) => (
            <FilterChip key={m} label={m} active={missionFocus === m} onClick={() => setMissionFocus(m)} />
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <FilterChip label="All cert status" active={certCategory === ""} onClick={() => setCertCategory("")} />
        {COMPETITOR_FILTERS.certificationCategories.map((c) => (
          <FilterChip key={c} label={c} active={certCategory === c} onClick={() => setCertCategory(c)} />
        ))}
      </div>

      <div className="mt-3 hidden overflow-x-auto rounded-xl border border-white/10 md:block">
        <table className="min-w-[1000px] w-full text-left text-sm">
          <thead className="bg-black/30 text-[10px] uppercase tracking-[0.12em] text-white/40">
            <tr>
              <SortableTh label="Company" sortKey="companyName" active={sortKey} dir={sortDir} onClick={toggleSort} />
              <SortableTh label="Mission" sortKey="missionFocus" active={sortKey} dir={sortDir} onClick={toggleSort} />
              <SortableTh label="Authority" sortKey="certAuthority" active={sortKey} dir={sortDir} onClick={toggleSort} />
              <SortableTh
                label="Certification"
                sortKey="certificationCategory"
                active={sortKey}
                dir={sortDir}
                onClick={toggleSort}
              />
              <SortableTh label="Funding" sortKey="fundingRaised" active={sortKey} dir={sortDir} onClick={toggleSort} />
              <th className="px-3 py-2.5 font-semibold">Partnerships</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.id}
                onClick={() => onOpen(c.id)}
                className="cursor-pointer border-t border-white/8 bg-white/[0.02] transition hover:bg-sky-500/10"
              >
                <td className="px-3 py-2.5 font-medium text-white">{c.companyName}</td>
                <td className="px-3 py-2.5">
                  <Field value={c.missionFocus} />
                </td>
                <td className="px-3 py-2.5">
                  <Field value={c.certAuthority} />
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      certificationTone(c.certificationCategory),
                    )}
                  >
                    {c.certificationCategory}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <Field value={c.fundingRaised} />
                </td>
                <td className="max-w-[200px] px-3 py-2.5">
                  <span className={cn("line-clamp-2", c.keyPartnerships ? "text-white/75" : "text-white/30")}>
                    {c.keyPartnerships || "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 space-y-2.5 md:hidden">
        {rows.map((c) => (
          <button
            key={`${c.id}-mobile`}
            type="button"
            onClick={() => onOpen(c.id)}
            className="flex w-full touch-manipulation flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-left transition hover:border-sky-400/30 hover:bg-sky-500/10"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-sm font-semibold text-white">{c.companyName}</p>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  certificationTone(c.certificationCategory),
                )}
              >
                {c.certificationCategory}
              </span>
            </div>
            <p className="text-xs text-white/60">
              <Field value={c.missionFocus} />
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/45">
              <span>
                Auth: <Field value={c.certAuthority} />
              </span>
              <span>
                Funding: <Field value={c.fundingRaised} />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CompetitorDetail({ competitor }: { competitor: CompetitorProfile }) {
  const router = useRouter();
  const basePath = useInternalOperationsBasePath();
  const competitors = useMemo(() => listCompetitors(), []);

  function back() {
    router.push(getInternalNavHref("oa-competitor-intelligence", basePath));
  }

  function selectCompetitor(id: string) {
    router.push(
      getInternalNavHref("oa-competitor-intelligence", basePath, { competitorId: id }),
    );
  }

  const provenanceText = [
    `${competitor.companyName} — ${competitor.aircraftName}`,
    `Authority: ${competitor.certAuthority || "—"}`,
    `Status: ${competitor.certificationStatus || competitor.certificationCategory}`,
    `Milestone: ${competitor.nextCertMilestone || "—"}`,
    `Partnerships: ${competitor.keyPartnerships || "—"}`,
    competitor.notablePublicFact ? `Public fact: ${competitor.notablePublicFact}` : null,
    competitor.dataNotes ? `Data notes: ${competitor.dataNotes}` : null,
    competitor.website ? `Website: ${competitor.website}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-5 p-1">
      <button
        type="button"
        onClick={back}
        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <header
        className="relative overflow-hidden rounded-2xl border p-5 sm:p-6"
        style={{
          borderColor: `${SKY}33`,
          background: `radial-gradient(ellipse at top left, ${SKY}18, transparent 55%), linear-gradient(135deg, #0b1826 0%, #0a1420 55%, #070d14 100%)`,
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/85">
              Public programme profile
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {competitor.companyName}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{competitor.description}</p>
          </div>
          <div className="w-full max-w-md">
            <label
              htmlFor="competitor-selector"
              className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/80"
            >
              Programme
            </label>
            <div className="relative mt-1.5">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-300/70" />
              <select
                id="competitor-selector"
                value={competitor.id}
                onChange={(e) => selectCompetitor(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/15 bg-black/35 py-2.5 pl-10 pr-9 text-sm font-medium text-white outline-none transition focus:border-sky-400/40"
              >
                {competitors.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0a1420] text-white">
                    {c.companyName} · {c.certAuthority || c.country}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center gap-2 text-xs text-white/55">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium",
              certificationTone(competitor.certificationCategory),
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {competitor.certificationCategory}
          </span>
          {competitor.certAuthority ? (
            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5">
              {competitor.certAuthority}
            </span>
          ) : null}
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5">
            {competitor.missionFocus}
          </span>
        </div>
      </header>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Certification (public)</h2>
          <CopyToClipboardButton text={provenanceText} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <DetailTile label="Authority" value={competitor.certAuthority} />
          <DetailTile label="Category" value={competitor.certificationCategory} />
          <DetailTile label="Reported status" value={competitor.certificationStatus} />
          <DetailTile label="Next public milestone" value={competitor.nextCertMilestone} />
        </div>
        {competitor.notablePublicFact ? (
          <p className="mt-4 text-sm text-white/65">{competitor.notablePublicFact}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold text-white">Capital & partnerships (public)</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <DetailTile label="Funding posture" value={competitor.fundingRaised} />
          <DetailTile label="Partnerships" value={competitor.keyPartnerships} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold text-white">Aircraft (reference)</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DetailTile label="Aircraft" value={competitor.aircraftName} />
          <DetailTile label="Type" value={competitor.aircraftType} />
          <DetailTile label="Capacity" value={competitor.passengerCapacity} />
          <DetailTile label="Range" value={competitor.range} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold text-white">Source</h2>
        {competitor.website ? (
          <a
            href={competitor.website}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-sky-300 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {competitor.website}
          </a>
        ) : (
          <p className="mt-2 text-sm text-white/40">No website on file.</p>
        )}
        {competitor.dataNotes ? (
          <p className="mt-3 text-xs leading-relaxed text-white/40">{competitor.dataNotes}</p>
        ) : null}
      </section>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 touch-manipulation rounded-full border px-3 py-2 text-xs font-medium transition sm:min-h-0 sm:px-2.5 sm:py-1.5 sm:text-[11px]",
        active
          ? "border-sky-400/50 bg-sky-500/20 text-sky-100"
          : "border-white/12 bg-black/20 text-white/60 hover:border-white/25 hover:text-white",
      )}
    >
      {label}
    </button>
  );
}

function SortableTh({
  label,
  sortKey,
  active,
  dir,
  onClick,
}: {
  label: string;
  sortKey: CompetitorSortKey;
  active: CompetitorSortKey;
  dir: "asc" | "desc";
  onClick: (key: CompetitorSortKey) => void;
}) {
  const isActive = active === sortKey;
  return (
    <th className="px-3 py-2.5 font-semibold">
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 transition",
          isActive ? "text-sky-300" : "text-white/40 hover:text-white/70",
        )}
      >
        {label}
        {isActive ? <span className="text-[9px]">{dir === "asc" ? "▲" : "▼"}</span> : null}
      </button>
    </th>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">{label}</p>
      <p className="mt-1.5 text-sm font-medium text-white/85">{value || "—"}</p>
    </div>
  );
}

export default OnwardAirCompetitorIntelligenceWorkspace;
