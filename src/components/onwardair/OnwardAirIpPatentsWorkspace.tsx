"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ExternalLink,
  FileText,
  FolderOpen,
  Layers,
  ScrollText,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { getInternalNavHref, type InternalOperationsView } from "@/lib/internal-operations-data";
import {
  groupPatentsByFamily,
  groupPatentsBySystem,
  listPatentDocuments,
  listPatents,
  patentSummaryStats,
  searchPatents,
  type PatentRecord,
  type PatentVerificationStatus,
} from "@/lib/onwardair/ip-patents-data";
import { cn } from "@/lib/utils";
import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";

type IpPatentsSection = "dashboard" | "register" | "portfolio" | "documents" | "search";

type OnwardAirIpPatentsWorkspaceProps = {
  section: IpPatentsSection;
};

const SECTION_VIEW: Record<IpPatentsSection, InternalOperationsView> = {
  dashboard: "oa-ip-dashboard",
  register: "oa-ip-register",
  portfolio: "oa-ip-portfolio",
  documents: "oa-ip-documents",
  search: "oa-ip-search",
};

function VerificationBadge({ status }: { status: PatentVerificationStatus }) {
  const isVerified = status === "Verified";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
        isVerified
          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
          : "border-amber-400/30 bg-amber-500/15 text-amber-200",
      )}
    >
      {isVerified ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {status}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-white/12 bg-[radial-gradient(ellipse_at_top_left,_rgba(14,165,233,0.22),_transparent_55%),linear-gradient(135deg,#0b1826_0%,#0a1420_55%,#070d14_100%)] px-5 py-6 sm:px-7 sm:py-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl"
      />
      <p className="relative text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/85">
        {eyebrow}
      </p>
      <h1 className="relative mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h1>
      <p className="relative mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{description}</p>
    </header>
  );
}

function SectionLinkChip({
  label,
  section,
  icon,
}: {
  label: string;
  section: IpPatentsSection;
  icon: React.ReactNode;
}) {
  const basePath = useInternalOperationsBasePath();
  const href = getInternalNavHref(SECTION_VIEW[section], basePath);
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-black/25 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-sky-400/40 hover:bg-sky-500/10 hover:text-white"
    >
      {icon}
      {label}
    </a>
  );
}

export function OnwardAirIpPatentsWorkspace({ section }: OnwardAirIpPatentsWorkspaceProps) {
  switch (section) {
    case "dashboard":
      return <IpDashboard />;
    case "register":
      return <IpRegister />;
    case "portfolio":
      return <IpPortfolio />;
    case "documents":
      return <IpDocuments />;
    case "search":
      return <IpSearch />;
    default:
      return null;
  }
}

function IpDashboard() {
  const stats = useMemo(() => patentSummaryStats(), []);
  const patents = useMemo(() => listPatents(), []);
  const basePath = useInternalOperationsBasePath();

  return (
    <div className="space-y-5 p-1">
      <SectionHeader
        eyebrow="OnwardAir · IP & Patents"
        title="IP & Patents Dashboard"
        description="Executive view of OnwardAir's patent portfolio — verified USPTO records alongside company-claimed IP awaiting independent verification."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Verified Patents"
          value={String(stats.verified)}
          hint="Confirmed against Google Patents public record"
          tone="good"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Verification Required"
          value={String(stats.verificationRequired)}
          hint="Company claims not yet independently verified"
          tone="warn"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          label="Applications / Placeholders"
          value={String(stats.applications)}
          hint="Provisional / non-provisional filings referenced but undisclosed"
          tone="default"
          icon={<FileText className="h-4 w-4" />}
        />
      </div>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold text-white">Research summary</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
          Two OnwardAir-linked patents are independently verified via Google Patents:{" "}
          <span className="font-medium text-white/85">US10198086B2</span> and{" "}
          <span className="font-medium text-white/85">US10324540B1</span>, both covering
          multi-degrees-of-freedom hand controller technology (Fluidity Technologies lineage, now
          assigned to OnwardAir, Inc.). OnwardAir's public site additionally claims a broader
          portfolio — including Vertex VTOL and FLEX Pods IP and 25+ issued patents — but specific
          filing numbers for those claims are not publicly enumerated and are recorded here as
          Verification Required rather than invented.
        </p>
      </section>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Key patents</h2>
          <SectionLinkChip
            label="Open full register"
            section="register"
            icon={<ScrollText className="h-3.5 w-3.5" />}
          />
        </div>
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-[820px] w-full text-left text-sm">
            <thead className="bg-black/30 text-[10px] uppercase tracking-[0.12em] text-white/40">
              <tr>
                <Th>Title</Th>
                <Th>Patent Number</Th>
                <Th>Aircraft System</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {patents.map((patent) => (
                <tr
                  key={patent.id}
                  className="border-t border-white/8 bg-white/[0.02]"
                >
                  <td className="max-w-[280px] px-3 py-2.5 font-medium text-white">
                    {patent.title}
                  </td>
                  <td className="px-3 py-2.5 text-white/70">{patent.patentNumber}</td>
                  <td className="px-3 py-2.5 text-white/70">{patent.aircraftSystem}</td>
                  <td className="px-3 py-2.5">
                    <VerificationBadge status={patent.verificationStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <SectionLinkChip
          label="Patent Portfolio"
          section="portfolio"
          icon={<Layers className="h-3.5 w-3.5" />}
        />
        <SectionLinkChip
          label="Patent Documents"
          section="documents"
          icon={<FolderOpen className="h-3.5 w-3.5" />}
        />
        <SectionLinkChip label="IP Search" section="search" icon={<Search className="h-3.5 w-3.5" />} />
      </div>
      <p className="text-[11px] text-white/30">
        Navigate to related IP & Patents views · workspace base {basePath}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "good" | "warn" | "default";
  icon: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border px-4 py-4",
        tone === "good" && "border-emerald-400/25 bg-emerald-500/10",
        tone === "warn" && "border-amber-400/30 bg-amber-500/10",
        tone === "default" && "border-white/10 bg-white/[0.03]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
          {label}
        </p>
        <span className="text-sky-300/80">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-1 text-xs text-white/40">{hint}</p>
    </article>
  );
}

function IpRegister() {
  const patents = useMemo(() => listPatents(), []);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PatentVerificationStatus>("all");
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = useInternalOperationsBasePath();

  const selectedId = searchParams.get("patentId");
  const selected = useMemo(
    () => patents.find((p) => p.id === selectedId) ?? null,
    [patents, selectedId],
  );

  const filtered = useMemo(() => {
    let rows = patents;
    if (statusFilter !== "all") {
      rows = rows.filter((p) => p.verificationStatus === statusFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((p) =>
        [p.title, p.patentNumber, p.aircraftSystem, p.patentFamily, p.assignee]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return rows;
  }, [patents, query, statusFilter]);

  function openPatent(id: string) {
    router.push(getInternalNavHref("oa-ip-register", basePath, { patentId: id }));
  }

  function closePatent() {
    router.push(getInternalNavHref("oa-ip-register", basePath));
  }

  return (
    <div className="space-y-5 p-1">
      <SectionHeader
        eyebrow="OnwardAir · IP & Patents"
        title="Patent Register"
        description="Every OnwardAir-linked patent and IP claim, with Verified vs Verification Required status. Click a row for full detail."
      />

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(["all", "Verified", "Verification Required"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setStatusFilter(opt)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                  statusFilter === opt
                    ? "border-sky-400/50 bg-sky-500/20 text-sky-100"
                    : "border-white/12 bg-black/20 text-white/60 hover:border-white/25 hover:text-white",
                )}
              >
                {opt === "all" ? "All" : opt}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, patent number, system…"
            className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-sky-400/50 focus:outline-none lg:w-80"
          />
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-[1000px] w-full text-left text-sm">
            <thead className="bg-black/30 text-[10px] uppercase tracking-[0.12em] text-white/40">
              <tr>
                <Th>Title</Th>
                <Th>Patent Number</Th>
                <Th>Jurisdiction</Th>
                <Th>Filing Date</Th>
                <Th>Grant Date</Th>
                <Th>Aircraft System</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((patent) => (
                <tr
                  key={patent.id}
                  onClick={() => openPatent(patent.id)}
                  className="cursor-pointer border-t border-white/8 bg-white/[0.02] transition hover:bg-sky-500/10"
                >
                  <td className="max-w-[260px] px-3 py-2.5 font-medium text-white">{patent.title}</td>
                  <td className="px-3 py-2.5 text-white/70">{patent.patentNumber}</td>
                  <td className="px-3 py-2.5 text-white/70">{patent.jurisdiction || "—"}</td>
                  <td className="px-3 py-2.5 text-white/70">{patent.filingDate || "—"}</td>
                  <td className="px-3 py-2.5 text-white/70">{patent.grantDate || "—"}</td>
                  <td className="px-3 py-2.5 text-white/70">{patent.aircraftSystem}</td>
                  <td className="px-3 py-2.5">
                    <VerificationBadge status={patent.verificationStatus} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-white/40">
                    No patents match this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-white/35">
          Showing {filtered.length} of {patents.length} records · click a row for full detail
        </p>
      </section>

      {selected ? <PatentDetailModal patent={selected} onClose={closePatent} /> : null}
    </div>
  );
}

function PatentDetailModal({ patent, onClose }: { patent: PatentRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-[#0a1420] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <VerificationBadge status={patent.verificationStatus} />
            <h2 className="mt-2 text-xl font-semibold text-white">{patent.title}</h2>
            <p className="mt-1 text-sm text-white/50">{patent.patentNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-white/60 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <DetailRow label="Filing Date" value={patent.filingDate || "—"} />
          <DetailRow label="Publication Date" value={patent.publicationDate || "—"} />
          <DetailRow label="Grant Date" value={patent.grantDate || "—"} />
          <DetailRow label="Status" value={patent.status} />
          <DetailRow label="Jurisdiction" value={patent.jurisdiction || "—"} />
          <DetailRow label="Patent Family" value={patent.patentFamily} />
          <DetailRow label="Aircraft System" value={patent.aircraftSystem} />
          <DetailRow label="Assignee" value={patent.assignee} />
        </dl>

        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-300/75">
            Inventors
          </p>
          <p className="mt-1.5 text-sm text-white/75">
            {patent.inventors.length > 0 ? patent.inventors.join(", ") : "—"}
          </p>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-300/75">
            Description
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/75">{patent.description}</p>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-300/75">
            Supporting Documents
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {patent.supportingDocuments.map((doc) => (
              <li key={doc.url}>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-sky-300 hover:text-sky-200 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {doc.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 rounded-xl border border-amber-400/15 bg-amber-500/[0.06] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200/80">
            Notes
          </p>
          <p className="mt-1 text-sm text-amber-50/90">{patent.notes}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-white/85">{value}</dd>
    </div>
  );
}

function IpPortfolio() {
  const byFamily = useMemo(() => groupPatentsByFamily(), []);
  const bySystem = useMemo(() => groupPatentsBySystem(), []);
  const stats = useMemo(() => patentSummaryStats(), []);

  return (
    <div className="space-y-5 p-1">
      <SectionHeader
        eyebrow="OnwardAir · IP & Patents"
        title="Patent Portfolio"
        description="Patents grouped by family and aircraft system, alongside OnwardAir's public portfolio-wide claims."
      />

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold text-white">Portfolio claim summary</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
          OnwardAir publicly states its IP portfolio spans 25+ issued patents plus provisional and
          non-provisional applications in queue. This register verifies{" "}
          {stats.verified} of those against the public patent record; the remaining{" "}
          {stats.verificationRequired} entries are recorded as Verification Required until
          individual filing numbers can be confirmed.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">By patent family</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {byFamily.map((group) => (
            <article key={group.family} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{group.family}</h3>
                <span className="rounded-full border border-white/12 bg-black/25 px-2 py-0.5 text-[10px] font-medium text-white/60">
                  {group.patents.length} record{group.patents.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {group.patents.map((patent) => (
                  <li key={patent.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate text-white/75">{patent.title}</span>
                    <VerificationBadge status={patent.verificationStatus} />
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">By aircraft system</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {bySystem.map((group) => (
            <article key={group.system} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{group.system}</h3>
                <span className="rounded-full border border-white/12 bg-black/25 px-2 py-0.5 text-[10px] font-medium text-white/60">
                  {group.patents.length} record{group.patents.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {group.patents.map((patent) => (
                  <li key={patent.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate text-white/75">{patent.title}</span>
                    <VerificationBadge status={patent.verificationStatus} />
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function IpDocuments() {
  const documents = useMemo(() => listPatentDocuments(), []);

  return (
    <div className="space-y-5 p-1">
      <SectionHeader
        eyebrow="OnwardAir · IP & Patents"
        title="Patent Documents"
        description="Supporting document links referenced across the patent register — public filings and company sources."
      />

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <div className="space-y-3">
          {documents.map((doc, idx) => (
            <a
              key={`${doc.patentId}-${idx}`}
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-sky-400/40 hover:bg-sky-500/10"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-4 w-4 shrink-0 text-sky-300/80" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{doc.label}</p>
                  <p className="truncate text-xs text-white/45">{doc.patentTitle}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <VerificationBadge status={doc.verificationStatus} />
                <ExternalLink className="h-3.5 w-3.5 text-white/40" />
              </div>
            </a>
          ))}
          {documents.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">No documents on file.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function IpSearch() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => (query.trim() ? searchPatents(query) : []), [query]);

  return (
    <div className="space-y-5 p-1">
      <SectionHeader
        eyebrow="OnwardAir · IP & Patents"
        title="IP Search"
        description="Full-text search across titles, patent numbers, inventors, aircraft systems, and notes."
      />

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patents by title, number, inventor, system…"
            className="w-full rounded-xl border border-white/15 bg-black/30 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-white/30 focus:border-sky-400/50 focus:outline-none"
            autoFocus
          />
        </div>

        <div className="mt-4 space-y-2.5">
          {query.trim() === "" ? (
            <p className="py-8 text-center text-sm text-white/40">
              Start typing to search the patent register.
            </p>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">
              No patents match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            results.map((patent) => (
              <article
                key={patent.id}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white">{patent.title}</h3>
                    <p className="mt-1 text-xs text-white/45">
                      {patent.patentNumber} · {patent.aircraftSystem}
                    </p>
                  </div>
                  <VerificationBadge status={patent.verificationStatus} />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{patent.description}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2.5 font-semibold">{children}</th>;
}

export default OnwardAirIpPatentsWorkspace;
