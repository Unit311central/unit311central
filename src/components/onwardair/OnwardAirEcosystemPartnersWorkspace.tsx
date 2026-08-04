"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Handshake,
  MapPin,
  Search,
  Shield,
  Users,
} from "lucide-react";

import {
  ECOSYSTEM_FILTERS,
  ECOSYSTEM_PARTNERS_INTRO,
  filterEcosystemPartners,
  listEcosystemPartners,
  searchEcosystemPartners,
  type EcosystemEngagementStatus,
  type EcosystemPartner,
  type EcosystemPartnerCategory,
} from "@/lib/onwardair/ecosystem-partners-data";
import { cn } from "@/lib/utils";

function statusTone(status: EcosystemEngagementStatus) {
  switch (status) {
    case "Active trial":
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
    case "Engaged":
      return "border-sky-400/30 bg-sky-500/15 text-sky-200";
    case "Priority target":
      return "border-amber-400/30 bg-amber-500/15 text-amber-200";
    case "Advisor relationship":
      return "border-violet-400/30 bg-violet-500/15 text-violet-200";
    default:
      return "border-white/15 bg-white/10 text-white/60";
  }
}

function categoryIcon(category: EcosystemPartnerCategory) {
  switch (category) {
    case "Airport / Vertiport":
      return <MapPin className="h-4 w-4" />;
    case "Middle-mile Logistics":
      return <Building2 className="h-4 w-4" />;
    case "Investor / Strategic":
      return <Handshake className="h-4 w-4" />;
    case "Regulator / Advisor":
      return <Shield className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
}

export function OnwardAirEcosystemPartnersWorkspace() {
  const partners = useMemo(() => listEcosystemPartners(), []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(partners[0]?.id ?? null);

  const rows = useMemo(() => {
    let list = query.trim() ? searchEcosystemPartners(query) : partners;
    list = filterEcosystemPartners(list, {
      category: category || undefined,
      status: status || undefined,
    });
    return list;
  }, [partners, query, category, status]);

  const selected =
    rows.find((p) => p.id === selectedId) ??
    partners.find((p) => p.id === selectedId) ??
    rows[0] ??
    null;

  const activeTrial = partners.filter((p) => p.status === "Active trial").length;
  const priority = partners.filter((p) => p.status === "Priority target").length;
  const regulators = partners.filter((p) => p.category === "Regulator / Advisor").length;

  return (
    <div className="space-y-5 p-1">
      <header className="relative overflow-hidden rounded-2xl border border-white/12 bg-[radial-gradient(ellipse_at_top_left,_rgba(192,38,211,0.18),_transparent_55%),linear-gradient(135deg,#0b1826_0%,#0a1420_55%,#070d14_100%)] px-5 py-6 sm:px-7 sm:py-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-fuchsia-400/10 blur-3xl"
        />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-300/85">
            {ECOSYSTEM_PARTNERS_INTRO.eyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {ECOSYSTEM_PARTNERS_INTRO.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
            {ECOSYSTEM_PARTNERS_INTRO.description}
          </p>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
          <Kpi label="Tracked partners" value={String(partners.length)} />
          <Kpi label="Active trials" value={String(activeTrial)} />
          <Kpi label="Priority targets · regulators" value={`${priority} · ${regulators}`} />
        </div>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search partners, owners, programmes…"
            className="w-full rounded-lg border border-white/15 bg-black/30 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-fuchsia-400/50 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip label="All categories" active={category === ""} onClick={() => setCategory("")} />
          {ECOSYSTEM_FILTERS.categories.map((c) => (
            <Chip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip label="All status" active={status === ""} onClick={() => setStatus("")} />
        {ECOSYSTEM_FILTERS.statuses.map((s) => (
          <Chip key={s} label={s} active={status === s} onClick={() => setStatus(s)} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03]">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Stakeholder register</h2>
            <p className="mt-0.5 text-xs text-white/45">
              {rows.length} of {partners.length} · click for engagement brief
            </p>
          </div>
          <ul className="divide-y divide-white/8">
            {rows.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3.5 text-left transition",
                    selected?.id === p.id
                      ? "bg-fuchsia-500/10"
                      : "hover:bg-white/[0.04]",
                  )}
                >
                  <span className="mt-0.5 text-fuchsia-300/80">{categoryIcon(p.category)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">{p.name}</span>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          statusTone(p.status),
                        )}
                      >
                        {p.status}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-white/45">
                      {p.category} · {p.region}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm text-white/60">
                      {p.whyItMatters}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {rows.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-white/40">
                No partners match this filter.
              </li>
            ) : null}
          </ul>
        </section>

        <PartnerDetail partner={selected} />
      </div>
    </div>
  );
}

function PartnerDetail({ partner }: { partner: EcosystemPartner | null }) {
  if (!partner) {
    return (
      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-6 text-sm text-white/45">
        Select a partner to see the engagement brief.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/[0.05] p-5 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-300/85">
        Engagement brief
      </p>
      <h2 className="mt-1 text-xl font-semibold text-white">{partner.name}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold",
            statusTone(partner.status),
          )}
        >
          {partner.status}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-black/25 px-2.5 py-1 text-[10px] font-medium text-white/70">
          {categoryIcon(partner.category)}
          {partner.category}
        </span>
      </div>

      <dl className="mt-5 space-y-3">
        <Detail label="Region" value={partner.region} />
        <Detail label="Why it matters" value={partner.whyItMatters} />
        <Detail label="Next engagement" value={partner.nextEngagement} />
        <Detail label="Owner" value={partner.owner} />
        <Detail label="Related programme" value={partner.relatedProgram} />
        {partner.website ? (
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
              Link
            </dt>
            <dd className="mt-1">
              <a
                href={partner.website}
                target="_blank"
                rel="noreferrer"
                className="break-all text-sm text-fuchsia-200 hover:underline"
              >
                {partner.website}
              </a>
            </dd>
          </div>
        ) : null}
        {partner.notes ? <Detail label="Notes" value={partner.notes} /> : null}
      </dl>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-relaxed text-white/80">{value}</dd>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/45">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function Chip({
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
          ? "border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-100"
          : "border-white/12 bg-black/20 text-white/60 hover:border-white/25 hover:text-white",
      )}
    >
      {label}
    </button>
  );
}

export default OnwardAirEcosystemPartnersWorkspace;
