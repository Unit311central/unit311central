"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Globe,
  Handshake,
  Plane,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import {
  COMPETITOR_FILTERS,
  filterCompetitors,
  getCompetitor,
  listCompetitors,
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

  return <CompetitorList />;
}

function CompetitorList() {
  const router = useRouter();
  const basePath = useInternalOperationsBasePath();
  const competitors = useMemo(() => listCompetitors(), []);
  const feedState = useCompetitorIntelFeed();
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [missionFocus, setMissionFocus] = useState("");
  const [certCategory, setCertCategory] = useState("");
  const [sortKey, setSortKey] = useState<CompetitorSortKey>("certificationCategory");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    ensureWeeklyCompetitorIntelligenceRefresh();
  }, []);

  const cadence = getCompetitorIntelCadence();
  const feedItems = useMemo(
    () =>
      feedState.items
        .slice()
        .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)),
    [feedState.items],
  );

  const rows = useMemo(() => {
    let list = query.trim() ? searchCompetitors(query) : competitors;
    list = filterCompetitors(list, {
      country: country || undefined,
      missionFocus: missionFocus || undefined,
      certificationCategory: certCategory || undefined,
    });
    return sortCompetitors(list, sortKey, sortDir);
  }, [competitors, query, country, missionFocus, certCategory, sortKey, sortDir]);

  const publicCount = competitors.filter((c) => c.fundingRaised.includes("Public")).length;
  const certifiedCount = competitors.filter(
    (c) => c.certificationCategory === "Certified / In Production",
  ).length;
  const inCertCount = competitors.filter(
    (c) => c.certificationCategory === "In Certification",
  ).length;
  const cargoMixedCount = competitors.filter(
    (c) => c.missionFocus === "Cargo / Utility" || c.missionFocus === "Mixed",
  ).length;

  function openCompetitor(id: string) {
    router.push(
      getInternalNavHref("oa-competitor-intelligence", basePath, { competitorId: id }),
    );
  }

  function toggleSort(key: CompetitorSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function refreshFeed() {
    const result = ensureWeeklyCompetitorIntelligenceRefresh({ force: true });
    setRefreshNotice(
      result.created
        ? `Cert-race feed refreshed for ${result.weekKey} · ${result.newItems.length} new item${result.newItems.length === 1 ? "" : "s"}.`
        : `Feed already current for ${result.weekKey}.`,
    );
    window.setTimeout(() => setRefreshNotice(null), 3500);
  }

  return (
    <div className="space-y-5 p-1">
      <header className="relative overflow-hidden rounded-2xl border border-white/12 bg-[radial-gradient(ellipse_at_top_left,_rgba(14,165,233,0.22),_transparent_55%),linear-gradient(135deg,#0b1826_0%,#0a1420_55%,#070d14_100%)] px-5 py-6 sm:px-7 sm:py-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/85">
              OnwardAir Intelligence · Certification race
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Competitor Intelligence
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
              Track who is winning the multi-year cert slog: authority posture, funding runway,
              partnerships, and cargo vs passenger mission. Passenger launch vanity is
              de-emphasized. Blank fields mean not confidently disclosed.
            </p>
          </div>
          <button
            type="button"
            onClick={refreshFeed}
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-500/15 px-3.5 py-2 text-xs font-semibold text-sky-100 transition hover:bg-sky-500/25"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh feed
          </button>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <KpiTile icon={<Radio className="h-4 w-4" />} label="This week" value={cadence.currentWeekKey} />
          <KpiTile
            icon={<TrendingUp className="h-4 w-4" />}
            label="Unread alerts"
            value={String(cadence.unreadCount)}
          />
          <KpiTile icon={<ShieldCheck className="h-4 w-4" />} label="In certification" value={String(inCertCount)} />
          <KpiTile icon={<Plane className="h-4 w-4" />} label="Cargo / mixed" value={String(cargoMixedCount)} />
          <KpiTile icon={<Globe className="h-4 w-4" />} label="Certified / in production" value={String(certifiedCount)} />
        </div>
        {refreshNotice ? (
          <p className="relative mt-3 text-xs font-medium text-emerald-300/90">{refreshNotice}</p>
        ) : null}
      </header>

      <LiveIntelligenceFeed
        items={feedItems}
        cadence={cadence}
        onOpenCompetitor={openCompetitor}
        onMarkRead={markCompetitorIntelRead}
        onMarkAllRead={markAllCompetitorIntelRead}
      />

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-300/80">
              Certification landscape
            </h2>
            <p className="mt-1 text-xs text-white/45">
              {publicCount} public companies tracked · sorted by cert posture by default
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company, authority, partners…"
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
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip label="All cert status" active={certCategory === ""} onClick={() => setCertCategory("")} />
          {COMPETITOR_FILTERS.certificationCategories.map((c) => (
            <FilterChip key={c} label={c} active={certCategory === c} onClick={() => setCertCategory(c)} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip label="All countries" active={country === ""} onClick={() => setCountry("")} />
          {COMPETITOR_FILTERS.countries.map((c) => (
            <FilterChip key={c} label={c} active={country === c} onClick={() => setCountry(c)} />
          ))}
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-[1180px] w-full text-left text-sm">
            <thead className="bg-black/30 text-[10px] uppercase tracking-[0.12em] text-white/40">
              <tr>
                <SortableTh label="Company" sortKey="companyName" active={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortableTh label="Aircraft" sortKey="aircraftName" active={sortKey} dir={sortDir} onClick={toggleSort} />
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
                <Th>Partnerships</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => openCompetitor(c.id)}
                  className="cursor-pointer border-t border-white/8 bg-white/[0.02] transition hover:bg-sky-500/10"
                >
                  <td className="px-3 py-2.5 font-medium text-white">{c.companyName}</td>
                  <td className="px-3 py-2.5">
                    <Field value={c.aircraftName} />
                  </td>
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
                  <td className="max-w-[220px] px-3 py-2.5">
                    <span className={cn("line-clamp-2", c.keyPartnerships ? "text-white/75" : "text-white/30")}>
                      {c.keyPartnerships || "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-white/40">
                    No competitors match this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-white/35">
          Showing {rows.length} of {competitors.length} competitors · click a row for full profile
        </p>
      </section>
    </div>
  );
}

function LiveIntelligenceFeed({
  items,
  cadence,
  onOpenCompetitor,
  onMarkRead,
  onMarkAllRead,
}: {
  items: CompetitorIntelItem[];
  cadence: ReturnType<typeof getCompetitorIntelCadence>;
  onOpenCompetitor: (id: string) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  return (
    <section className="rounded-2xl border border-sky-400/25 bg-sky-500/[0.06] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/85">
            Live cert-race feed
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Weekly certification updates</h2>
          <p className="mt-1 text-sm text-white/55">
            Week {cadence.currentWeekKey}
            {cadence.lastEnsuredAt
              ? ` · last ensured ${new Date(cadence.lastEnsuredAt).toLocaleString("en-GB")}`
              : ""}
            {" · "}
            next cadence {cadence.nextRefreshLabel}
            {cadence.weeklyRefreshDue ? " · refresh due" : " · current"}
          </p>
        </div>
        {cadence.unreadCount > 0 ? (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/80 hover:bg-white/10"
          >
            Mark all read
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {items.slice(0, 8).map((item) => (
          <article
            key={item.id}
            className={cn(
              "rounded-xl border px-4 py-3",
              item.read
                ? "border-white/10 bg-black/20"
                : "border-sky-400/35 bg-sky-500/10",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/55">
                {item.category}
              </span>
              {!item.read ? (
                <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                  New
                </span>
              ) : null}
              <span className="text-[11px] text-white/40">
                {new Date(item.publishedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-white">{item.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/60">{item.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.competitorId ? (
                <button
                  type="button"
                  onClick={() => {
                    onMarkRead(item.id);
                    onOpenCompetitor(item.competitorId!);
                  }}
                  className="rounded-full border border-sky-400/40 bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold text-sky-100"
                >
                  Open {item.competitorName ?? "competitor"}
                </button>
              ) : null}
              {!item.read ? (
                <button
                  type="button"
                  onClick={() => onMarkRead(item.id)}
                  className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70"
                >
                  Mark read
                </button>
              ) : null}
              <span className="self-center text-[10px] text-white/35">{item.sourceLabel}</span>
            </div>
          </article>
        ))}
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/45">No intelligence items yet.</p>
        ) : null}
      </div>
    </section>
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
    `Mission: ${competitor.missionFocus}`,
    `Cert: ${competitor.certificationStatus || competitor.certificationCategory}`,
    `Partnerships: ${competitor.keyPartnerships || "—"}`,
    `OA relevance: ${competitor.oaRelevance}`,
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
        Back to Competitor Intelligence
      </button>

      <header
        className="relative overflow-hidden rounded-2xl border p-5 sm:p-7"
        style={{
          borderColor: `${SKY}33`,
          background: `radial-gradient(ellipse at top left, ${SKY}2E, transparent 55%), linear-gradient(135deg, #0b1826 0%, #0a1420 55%, #070d14 100%)`,
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/85">
              Cert-race profile
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
              Competitor
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
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5">
              {competitor.certAuthority}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5">
            <Plane className="h-3.5 w-3.5" />
            {competitor.missionFocus}
          </span>
          {competitor.yearsOperating ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5">
              <Users className="h-3.5 w-3.5" />
              {competitor.yearsOperating} years operating
            </span>
          ) : null}
        </div>
      </header>

      <section className="rounded-2xl border border-sky-400/25 bg-sky-500/[0.06] p-5">
        <h2 className="text-sm font-semibold text-white">Why it matters to OnwardAir</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/75">{competitor.oaRelevance}</p>
      </section>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold text-white">Certification pathway</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <DetailTile label="Authority" value={competitor.certAuthority} />
          <DetailTile label="Status" value={competitor.certificationCategory} />
          <DetailTile label="Public status detail" value={competitor.certificationStatus} />
          <DetailTile label="Next milestone" value={competitor.nextCertMilestone} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2">
          <Handshake className="h-4 w-4 text-sky-300/80" />
          <h2 className="text-sm font-semibold text-white">Funding & partnerships</h2>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <DetailTile label="Funding / capital posture" value={competitor.fundingRaised} />
          <DetailTile label="Estimated revenue" value={competitor.estimatedRevenue} />
          <DetailTile label="Key partnerships" value={competitor.keyPartnerships} />
          <DetailTile label="Employees" value={competitor.employees} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Overview</h2>
          <CopyToClipboardButton text={provenanceText} />
        </div>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <DetailRow label="Headquarters" value={competitor.headquarters} />
          <DetailRow label="Country" value={competitor.country} />
          <DetailRow label="Founded" value={competitor.founded ? String(competitor.founded) : "—"} />
          <DetailRow
            label="Years Operating"
            value={competitor.yearsOperating ? String(competitor.yearsOperating) : "—"}
          />
        </dl>
      </section>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold text-white">Aircraft (secondary)</h2>
        <p className="mt-1 text-xs text-white/40">
          Specs kept for context — not the primary cert-race signal.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DetailTile label="Aircraft" value={competitor.aircraftName} />
          <DetailTile label="Type" value={competitor.aircraftType} />
          <DetailTile label="Capacity" value={competitor.passengerCapacity} />
          <DetailTile label="Range" value={competitor.range} />
          <DetailTile label="Cruise Speed" value={competitor.cruiseSpeed} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold text-white">Website</h2>
        {competitor.website ? (
          <a
            href={competitor.website}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-sky-300 hover:text-sky-200 hover:underline"
          >
            <Globe className="h-3.5 w-3.5" />
            {competitor.website}
          </a>
        ) : (
          <p className="mt-2 text-sm text-white/40">Not available.</p>
        )}
      </section>

      {competitor.dataNotes ? (
        <section className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/80">
            Data provenance
          </p>
          <p className="mt-2 text-sm leading-relaxed text-amber-50/90">{competitor.dataNotes}</p>
        </section>
      ) : null}
    </div>
  );
}

function KpiTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
      <div className="flex items-center gap-1.5 text-sky-300/80">
        {icon}
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/45">{label}</p>
      </div>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
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
        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
        active
          ? "border-sky-400/50 bg-sky-500/20 text-sky-100"
          : "border-white/12 bg-black/20 text-white/60 hover:border-white/25 hover:text-white",
      )}
    >
      {label}
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2.5 font-semibold">{children}</th>;
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-white/85">{value || "—"}</dd>
    </div>
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
