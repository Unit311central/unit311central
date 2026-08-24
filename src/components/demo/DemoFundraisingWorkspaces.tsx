"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";

import {
  CorporateKpiTile,
  CorporateSection,
  CorporateStatusPill,
  corporateInputClass,
  corporatePrimaryButtonClass,
  corporateSecondaryButtonClass,
} from "@/components/testflighthub/corporate-ui";
import {
  NORTHSTAR_FUNDING_ROUNDS,
  NORTHSTAR_FUNDRAISING_PIPELINE_SEED,
  NORTHSTAR_INVESTORS,
  NORTHSTAR_SEED_EXPECTED_CLOSE,
  NORTHSTAR_SEED_TARGET_GBP,
  NORTHSTAR_SERIES_A_TARGET_GBP,
  NORTHSTAR_TOTAL_RAISED_GBP,
  type DataRoomRow,
  type DemoInvestor,
  type FundraisingMeeting,
  type FundraisingPipelineDeal,
  type FundraisingPipelineStage,
  type InvestorDocuments,
  type InvestorType,
  type PitchDeckVersion,
  type ShareClassLabel,
  type ShareTypeLabel,
} from "@/lib/demo/fundraising-data";
import {
  getNorthstarDataRooms,
  getNorthstarFundraisingMeetings,
  getNorthstarPitchDecks,
} from "@/lib/demo/module-fixtures";
import { formatSalesMoney } from "@/lib/sales-management-insights";
import { cn } from "@/lib/utils";

const FUNDRAISING_TILE_STORAGE_KEY = "northstar-fundraising-dashboard-tiles-v1";

type DashboardTile = {
  id: string;
  label: string;
  value: string;
  hint: string;
};

function formatMoney(value: number) {
  return formatSalesMoney(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function thClass() {
  return "px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45";
}

function tdClass() {
  return "px-3 py-2.5 text-sm text-white/75";
}

function tableWrapClass() {
  return "overflow-x-auto rounded-xl border border-white/10";
}

const PIPELINE_STAGES: FundraisingPipelineStage[] = [
  "Intro",
  "Pitch sent",
  "Meeting",
  "Diligence",
  "Term sheet",
  "Passed",
];

const INVESTOR_TYPES: InvestorType[] = ["VC", "Family office", "Angel", "Corporate", "Strategic", "Other"];
const SHARE_CLASSES: ShareClassLabel[] = ["Ordinary shares", "Preference shares", "Options"];
const SHARE_TYPES: ShareTypeLabel[] = ["Equity", "Options"];

function buildDefaultDashboardTiles(): DashboardTile[] {
  const seedRound = NORTHSTAR_FUNDING_ROUNDS.find((r) => r.id === "seed-2026");
  return [
    {
      id: "raised",
      label: "Total raised",
      value: formatMoney(NORTHSTAR_TOTAL_RAISED_GBP),
      hint: "Pre-seed closed (2023)",
    },
    {
      id: "seed",
      label: "Seed round",
      value: formatMoney(NORTHSTAR_SEED_TARGET_GBP),
      hint: "In progress · $5M target",
    },
    {
      id: "seed-close",
      label: "Seed expected close",
      value: formatDate(NORTHSTAR_SEED_EXPECTED_CLOSE),
      hint: seedRound?.lead ? `Lead: ${seedRound.lead}` : "Q4 2026",
    },
    {
      id: "series-a",
      label: "Series A aspiration",
      value: formatMoney(NORTHSTAR_SERIES_A_TARGET_GBP),
      hint: "Target raise 2027",
    },
    {
      id: "cash",
      label: "Cash",
      value: formatMoney(1_900_000),
      hint: "Treasury position",
    },
    {
      id: "founder",
      label: "Founder ownership",
      value: "60%",
      hint: "Paul Fotheringham · ordinary equity",
    },
  ];
}

function formatShares(value: number) {
  return value.toLocaleString("en-GB");
}

function InvestorDocumentLinks({ documents }: { documents: InvestorDocuments }) {
  const links = [
    { key: "articlesOfAssociation", label: "Articles" },
    { key: "shareholderAgreement", label: "SHA" },
    { key: "shareCertificate", label: "Certificate" },
  ] as const;

  const available = links.filter((link) => documents[link.key]);
  if (available.length === 0) return <span className="text-white/35">—</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {available.map((link) => (
        <a
          key={link.key}
          href={documents[link.key]}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-sky-300 hover:text-sky-200"
        >
          {link.label}
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
      ))}
    </div>
  );
}

function stagePillClass(stage: string) {
  if (stage === "Term sheet" || stage === "Diligence") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  }
  if (stage === "Passed") return "border-white/15 bg-white/5 text-white/50";
  if (stage === "Meeting" || stage === "Pitch sent") {
    return "border-sky-400/30 bg-sky-500/15 text-sky-100";
  }
  return "border-amber-400/30 bg-amber-500/15 text-amber-100";
}

function emptyInvestor(): DemoInvestor {
  return {
    id: `inv-${Date.now()}`,
    fundName: "",
    leadContact: "",
    investorType: "VC",
    investmentAmountGbp: 0,
    ownershipPct: 0,
    sharesIssued: 0,
    shareClass: "Ordinary shares",
    shareType: "Equity",
    round: "Pre-seed (2023)",
    status: "portfolio",
    lastContact: new Date().toISOString().slice(0, 10),
    documents: {},
  };
}

export function DemoFundraisingDashboardWorkspace() {
  const [editing, setEditing] = useState(false);
  const [tiles, setTiles] = useState<DashboardTile[]>(() => buildDefaultDashboardTiles());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FUNDRAISING_TILE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as DashboardTile[];
      if (Array.isArray(parsed) && parsed.length > 0) setTiles(parsed);
    } catch {
      // ignore
    }
  }, []);

  const saveTiles = useCallback((next: DashboardTile[]) => {
    setTiles(next);
    try {
      localStorage.setItem(FUNDRAISING_TILE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Fundraising Dashboard</h1>
          <p className="mt-1 text-sm text-white/60">Northstar funding history and investor relations</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
            editing
              ? "border-sky-400/40 bg-sky-500/15 text-sky-200"
              : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20",
          )}
        >
          <Pencil className="h-3.5 w-3.5" />
          {editing ? "Done editing" : "Edit tiles"}
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile, index) =>
          editing ? (
            <div key={tile.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <input
                className="w-full rounded-lg border border-white/10 bg-[#060d18] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70"
                value={tile.label}
                onChange={(e) => {
                  const next = [...tiles];
                  next[index] = { ...tile, label: e.target.value };
                  saveTiles(next);
                }}
              />
              <input
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#060d18] px-2 py-1 text-xl font-semibold text-white"
                value={tile.value}
                onChange={(e) => {
                  const next = [...tiles];
                  next[index] = { ...tile, value: e.target.value };
                  saveTiles(next);
                }}
              />
              <input
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#060d18] px-2 py-1 text-xs text-white/50"
                value={tile.hint}
                onChange={(e) => {
                  const next = [...tiles];
                  next[index] = { ...tile, hint: e.target.value };
                  saveTiles(next);
                }}
              />
            </div>
          ) : (
            <CorporateKpiTile key={tile.id} label={tile.label} value={tile.value} hint={tile.hint} />
          ),
        )}
      </div>

      <CorporateSection title="Funding rounds">
        <div className="space-y-3">
          {NORTHSTAR_FUNDING_ROUNDS.map((round) => (
            <div
              key={round.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">
                    {round.label} · {round.year}
                  </p>
                  <p className="text-sm text-white/55">Lead: {round.lead}</p>
                  {round.expectedCloseDate ? (
                    <p className="text-xs text-sky-300/80">
                      Expected close {formatDate(round.expectedCloseDate)}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{formatMoney(round.amountGbp)}</p>
                  <CorporateStatusPill>{round.status}</CorporateStatusPill>
                </div>
              </div>
              {round.investors.length > 0 ? (
                <ul className="mt-3 space-y-1 border-t border-white/[0.06] pt-3 text-xs text-white/50">
                  {round.investors.map((name) => (
                    <li key={name}>· {name}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </CorporateSection>
    </div>
  );
}

export function DemoFundraisingInvestorsWorkspace() {
  const [investors, setInvestors] = useState<DemoInvestor[]>(() =>
    NORTHSTAR_INVESTORS.filter((inv) => inv.status === "portfolio").map((inv) => ({ ...inv })),
  );
  const [editing, setEditing] = useState<DemoInvestor | null>(null);

  const totalShares = investors.reduce((sum, inv) => sum + inv.sharesIssued, 0);
  const totalShareholdingPct = investors.reduce((sum, inv) => sum + inv.ownershipPct, 0);
  const totalInvestment = investors.reduce((sum, inv) => sum + inv.investmentAmountGbp, 0);

  function saveInvestor() {
    if (!editing?.fundName.trim()) return;
    setInvestors((current) => {
      const exists = current.some((row) => row.id === editing.id);
      if (exists) return current.map((row) => (row.id === editing.id ? editing : row));
      return [editing, ...current];
    });
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Investors</h1>
          <p className="mt-1 text-sm text-white/60">Pre-seed cap table investors.</p>
        </div>
        <button type="button" className={corporatePrimaryButtonClass()} onClick={() => setEditing(emptyInvestor())}>
          <Plus className="mr-1.5 inline h-4 w-4" />
          Add investor
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <CorporateKpiTile
          label="Total shareholding"
          value={`${totalShareholdingPct.toFixed(3).replace(/\.?0+$/, "")}%`}
          hint={`${investors.length} pre-seed investors`}
        />
        <CorporateKpiTile
          label="Total shares issued"
          value={formatShares(totalShares)}
          hint="Ordinary shares · pre-seed round"
        />
        <CorporateKpiTile
          label="Total invested"
          value={formatMoney(totalInvestment)}
          hint="Pre-seed round (2023)"
        />
      </section>

      <CorporateSection
        title="Investor register"
        subtitle="Company, contact, investment, shareholding, and linked investment documents."
      >
        <div className={tableWrapClass()}>
          <table className="min-w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={thClass()}>Company / fund</th>
                <th className={thClass()}>Lead contact</th>
                <th className={thClass()}>Investor type</th>
                <th className={thClass()}>Investment</th>
                <th className={thClass()}>Shares</th>
                <th className={thClass()}>% Shareholding</th>
                <th className={thClass()}>Share class</th>
                <th className={thClass()}>Documents</th>
                <th className={thClass()} />
              </tr>
            </thead>
            <tbody>
              {investors.map((inv) => (
                <tr key={inv.id} className="border-b border-white/5 last:border-0">
                  <td className={cn(tdClass(), "font-medium text-white")}>{inv.fundName}</td>
                  <td className={tdClass()}>{inv.leadContact}</td>
                  <td className={tdClass()}>{inv.investorType}</td>
                  <td className={cn(tdClass(), "tabular-nums")}>{formatMoney(inv.investmentAmountGbp)}</td>
                  <td className={cn(tdClass(), "tabular-nums")}>{formatShares(inv.sharesIssued)}</td>
                  <td className={cn(tdClass(), "tabular-nums")}>{inv.ownershipPct}%</td>
                  <td className={tdClass()}>{inv.shareClass}</td>
                  <td className={tdClass()}>
                    <InvestorDocumentLinks documents={inv.documents} />
                  </td>
                  <td className={tdClass()}>
                    <button
                      type="button"
                      className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-white"
                      onClick={() => setEditing(inv)}
                      aria-label={`Edit ${inv.fundName}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-white/10 bg-white/[0.03]">
              <tr>
                <td colSpan={3} className={cn(tdClass(), "font-semibold text-white")}>
                  Total
                </td>
                <td className={cn(tdClass(), "tabular-nums font-semibold text-white")}>
                  {formatMoney(totalInvestment)}
                </td>
                <td className={cn(tdClass(), "tabular-nums font-semibold text-white")}>
                  {formatShares(totalShares)}
                </td>
                <td className={cn(tdClass(), "tabular-nums font-semibold text-white")}>
                  {totalShareholdingPct.toFixed(3).replace(/\.?0+$/, "")}%
                </td>
                <td colSpan={3} className={tdClass()} />
              </tr>
            </tfoot>
          </table>
        </div>
      </CorporateSection>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1524] p-5">
            <h3 className="text-lg font-semibold text-white">
              {investors.some((r) => r.id === editing.id && r.fundName) ? "Edit investor" : "New investor"}
            </h3>
            <div className="mt-4 space-y-3">
              <label className="block text-sm text-white/60">
                Company / fund name
                <input
                  className={cn(corporateInputClass(), "mt-1 w-full")}
                  value={editing.fundName}
                  onChange={(e) => setEditing({ ...editing, fundName: e.target.value })}
                />
              </label>
              <label className="block text-sm text-white/60">
                Lead contact
                <input
                  className={cn(corporateInputClass(), "mt-1 w-full")}
                  value={editing.leadContact}
                  onChange={(e) => setEditing({ ...editing, leadContact: e.target.value })}
                />
              </label>
              <label className="block text-sm text-white/60">
                Investor type
                <select
                  className={cn(corporateInputClass(), "mt-1 w-full")}
                  value={editing.investorType}
                  onChange={(e) =>
                    setEditing({ ...editing, investorType: e.target.value as InvestorType })
                  }
                >
                  {INVESTOR_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-white/60">
                  Investment (USD)
                  <input
                    type="number"
                    className={cn(corporateInputClass(), "mt-1 w-full")}
                    value={editing.investmentAmountGbp || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, investmentAmountGbp: Number(e.target.value) || 0 })
                    }
                  />
                </label>
                <label className="block text-sm text-white/60">
                  % shareholding
                  <input
                    type="number"
                    step="0.001"
                    className={cn(corporateInputClass(), "mt-1 w-full")}
                    value={editing.ownershipPct || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, ownershipPct: Number(e.target.value) || 0 })
                    }
                  />
                </label>
              </div>
              <label className="block text-sm text-white/60">
                Shares issued
                <input
                  type="number"
                  className={cn(corporateInputClass(), "mt-1 w-full")}
                  value={editing.sharesIssued || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, sharesIssued: Number(e.target.value) || 0 })
                  }
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-white/60">
                  Share class
                  <select
                    className={cn(corporateInputClass(), "mt-1 w-full")}
                    value={editing.shareClass}
                    onChange={(e) =>
                      setEditing({ ...editing, shareClass: e.target.value as ShareClassLabel })
                    }
                  >
                    {SHARE_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-white/60">
                  Share type
                  <select
                    className={cn(corporateInputClass(), "mt-1 w-full")}
                    value={editing.shareType}
                    onChange={(e) =>
                      setEditing({ ...editing, shareType: e.target.value as ShareTypeLabel })
                    }
                  >
                    {SHARE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-sm text-white/60">
                Round
                <input
                  className={cn(corporateInputClass(), "mt-1 w-full")}
                  value={editing.round}
                  onChange={(e) => setEditing({ ...editing, round: e.target.value })}
                />
              </label>
              <label className="block text-sm text-white/60">
                Status
                <select
                  className={cn(corporateInputClass(), "mt-1 w-full")}
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.target.value as DemoInvestor["status"] })
                  }
                >
                  <option value="portfolio">portfolio</option>
                  <option value="pipeline">pipeline</option>
                  <option value="passed">passed</option>
                </select>
              </label>
              <label className="block text-sm text-white/60">
                Last contact
                <input
                  type="date"
                  className={cn(corporateInputClass(), "mt-1 w-full")}
                  value={editing.lastContact}
                  onChange={(e) => setEditing({ ...editing, lastContact: e.target.value })}
                />
              </label>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
                Investment documents
              </p>
              {(
                [
                  ["articlesOfAssociation", "Articles of association"],
                  ["shareholderAgreement", "Shareholder agreement"],
                  ["shareCertificate", "Share certificate"],
                ] as const
              ).map(([field, label]) => (
                <label key={field} className="block text-sm text-white/60">
                  {label}
                  <input
                    className={cn(corporateInputClass(), "mt-1 w-full")}
                    placeholder="https://…"
                    value={editing.documents[field] ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        documents: { ...editing.documents, [field]: e.target.value || undefined },
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={corporateSecondaryButtonClass()} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className={corporatePrimaryButtonClass()} onClick={saveInvestor}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DemoFundraisingPipelineWorkspace() {
  const [pipeline, setPipeline] = useState<FundraisingPipelineDeal[]>(() =>
    NORTHSTAR_FUNDRAISING_PIPELINE_SEED.map((deal) => ({ ...deal })),
  );
  const [editing, setEditing] = useState<FundraisingPipelineDeal | null>(null);

  const openDeals = pipeline.filter((d) => d.stage !== "Passed");
  const pipelineGbp = openDeals.reduce((sum, d) => sum + d.amountGbp, 0);

  function saveDeal() {
    if (!editing?.firm.trim()) return;
    setPipeline((current) => {
      const exists = current.some((row) => row.id === editing.id);
      if (exists) return current.map((row) => (row.id === editing.id ? editing : row));
      return [editing, ...current];
    });
    setEditing(null);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Pipeline</h1>
          <p className="mt-1 text-sm text-white/60">Seed round — Northstar investor progression.</p>
        </div>
        <button
          type="button"
          className={corporatePrimaryButtonClass()}
          onClick={() =>
            setEditing({
              id: `pipe-${Date.now()}`,
              investor: "",
              firm: "",
              stage: "Intro",
              amountGbp: 0,
              owner: "Elena Hart",
              lastTouch: new Date().toISOString().slice(0, 10),
              notes: "",
            })
          }
        >
          <Plus className="mr-1.5 inline h-4 w-4" />
          Add deal
        </button>
      </header>
      <section className="grid gap-3 sm:grid-cols-3">
        <CorporateKpiTile label="Open deals" value={openDeals.length} hint="Active pipeline" />
        <CorporateKpiTile label="Pipeline value" value={formatMoney(pipelineGbp)} hint="Excludes passed" />
        <CorporateKpiTile
          label="Seed target"
          value={formatMoney(NORTHSTAR_SEED_TARGET_GBP)}
          hint={`Expected close ${formatDate(NORTHSTAR_SEED_EXPECTED_CLOSE)}`}
        />
      </section>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {PIPELINE_STAGES.map((stage) => (
          <div key={stage} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">{stage}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
              {pipeline.filter((d) => d.stage === stage).length}
            </p>
          </div>
        ))}
      </div>
      <CorporateSection title="Active deals" subtitle="Editable seed pipeline — intros, pitches, diligence, and term sheets.">
        <div className={tableWrapClass()}>
          <table className="min-w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={thClass()}>Investor</th>
                <th className={thClass()}>Firm</th>
                <th className={thClass()}>Stage</th>
                <th className={thClass()}>Amount</th>
                <th className={thClass()}>Intro</th>
                <th className={thClass()}>Pitch sent</th>
                <th className={thClass()}>Owner</th>
                <th className={thClass()}>Last touch</th>
                <th className={thClass()}>Notes</th>
                <th className={thClass()} />
              </tr>
            </thead>
            <tbody>
              {pipeline.map((deal) => (
                <tr key={deal.id} className="border-b border-white/5 last:border-0">
                  <td className={cn(tdClass(), "font-medium text-white")}>{deal.investor}</td>
                  <td className={tdClass()}>{deal.firm}</td>
                  <td className={tdClass()}>
                    <CorporateStatusPill className={stagePillClass(deal.stage)}>{deal.stage}</CorporateStatusPill>
                  </td>
                  <td className={cn(tdClass(), "tabular-nums")}>{formatMoney(deal.amountGbp)}</td>
                  <td className={tdClass()}>{deal.introDate ? formatDate(deal.introDate) : "—"}</td>
                  <td className={tdClass()}>{deal.pitchSentDate ? formatDate(deal.pitchSentDate) : "—"}</td>
                  <td className={tdClass()}>{deal.owner}</td>
                  <td className={tdClass()}>{formatDate(deal.lastTouch)}</td>
                  <td className={cn(tdClass(), "max-w-xs text-white/55")}>{deal.notes}</td>
                  <td className={tdClass()}>
                    <button
                      type="button"
                      className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-white"
                      onClick={() => setEditing(deal)}
                      aria-label={`Edit ${deal.firm}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CorporateSection>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1524] p-5">
            <h3 className="text-lg font-semibold text-white">Pipeline deal</h3>
            <div className="mt-4 space-y-3">
              {(
                [
                  ["investor", "Investor contact"],
                  ["firm", "Firm"],
                  ["amountGbp", "Amount (USD)"],
                  ["owner", "Owner"],
                  ["lastTouch", "Last touch"],
                  ["introDate", "Intro date"],
                  ["pitchSentDate", "Pitch sent date"],
                  ["notes", "Notes"],
                ] as const
              ).map(([field, label]) => (
                <label key={field} className="block text-sm text-white/60">
                  {label}
                  <input
                    type={field.includes("Date") || field === "lastTouch" ? "date" : field === "amountGbp" ? "number" : "text"}
                    className={cn(corporateInputClass(), "mt-1 w-full")}
                    value={
                      field === "amountGbp"
                        ? editing.amountGbp || ""
                        : (editing[field] as string | undefined) ?? ""
                    }
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        [field]:
                          field === "amountGbp" ? Number(e.target.value) || 0 : e.target.value || undefined,
                      })
                    }
                  />
                </label>
              ))}
              <label className="block text-sm text-white/60">
                Stage
                <select
                  className={cn(corporateInputClass(), "mt-1 w-full")}
                  value={editing.stage}
                  onChange={(e) =>
                    setEditing({ ...editing, stage: e.target.value as FundraisingPipelineStage })
                  }
                >
                  {PIPELINE_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-between gap-2">
              <button
                type="button"
                className={corporateSecondaryButtonClass()}
                onClick={() => {
                  setPipeline((current) => current.filter((row) => row.id !== editing.id));
                  setEditing(null);
                }}
              >
                <Trash2 className="mr-1 inline h-4 w-4" />
                Delete
              </button>
              <div className="flex gap-2">
                <button type="button" className={corporateSecondaryButtonClass()} onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button type="button" className={corporatePrimaryButtonClass()} onClick={saveDeal}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DemoFundraisingMeetingsWorkspace() {
  const meetings = getNorthstarFundraisingMeetings();
  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Meetings</h1>
        <p className="mt-1 text-sm text-white/60">Upcoming Northstar investor meetings.</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-3">
        <CorporateKpiTile label="Upcoming" value={meetings.length} hint="Scheduled sessions" />
        <CorporateKpiTile
          label="Deck sent"
          value={meetings.filter((m) => m.pitchDeckSent).length}
          hint="Pitch deck shared"
        />
        <CorporateKpiTile
          label="Confirmed"
          value={meetings.filter((m) => m.status === "Confirmed").length}
          hint="On calendar"
        />
      </section>
      <CorporateSection title="Investor meetings">
        <div className={tableWrapClass()}>
          <table className="min-w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={thClass()}>Title</th>
                <th className={thClass()}>Investor</th>
                <th className={thClass()}>Date</th>
                <th className={thClass()}>With</th>
                <th className={thClass()}>Deck</th>
                <th className={thClass()}>Link</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((meeting: FundraisingMeeting) => (
                <tr key={meeting.id} className="border-b border-white/5 last:border-0">
                  <td className={cn(tdClass(), "font-medium text-white")}>{meeting.title}</td>
                  <td className={tdClass()}>{meeting.firm}</td>
                  <td className={tdClass()}>
                    {formatDate(meeting.date)} · {meeting.time}
                  </td>
                  <td className={tdClass()}>{meeting.withWhom}</td>
                  <td className={tdClass()}>{meeting.pitchDeckSent ? "Sent" : "Pending"}</td>
                  <td className={tdClass()}>
                    <a href={meeting.meetingLink} className="text-sky-300 hover:text-sky-200">
                      Join
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CorporateSection>
    </div>
  );
}

type DeckForm = {
  id?: string;
  version: string;
  title: string;
  fileName: string;
  notes: string;
  lastUpdatedBy: string;
};

export function DemoFundraisingPitchDecksWorkspace() {
  const [decks, setDecks] = useState<PitchDeckVersion[]>(() => getNorthstarPitchDecks());
  const [form, setForm] = useState<DeckForm | null>(null);

  function saveForm() {
    if (!form || !form.version.trim() || !form.title.trim()) return;
    const now = new Date().toISOString();
    if (form.id) {
      setDecks((prev) =>
        prev.map((d) =>
          d.id === form.id
            ? {
                ...d,
                version: form.version,
                title: form.title,
                fileName: form.fileName || d.fileName,
                notes: form.notes,
                lastUpdatedAt: now,
                lastUpdatedBy: form.lastUpdatedBy || "Admin",
              }
            : d,
        ),
      );
    } else {
      setDecks((prev) => [
        {
          id: `nst-deck-${Date.now()}`,
          version: form.version,
          title: form.title,
          dateAdded: now.slice(0, 10),
          lastUpdatedAt: now,
          lastUpdatedBy: form.lastUpdatedBy || "Admin",
          fileName: form.fileName || `Northstar_Pitch_v${form.version}.pdf`,
          notes: form.notes,
        },
        ...prev,
      ]);
    }
    setForm(null);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Pitch Decks</h1>
          <p className="mt-1 text-sm text-white/60">Northstar investor materials — add, edit, or remove versions.</p>
        </div>
        <button
          type="button"
          className={corporatePrimaryButtonClass()}
          onClick={() =>
            setForm({
              version: "3.3",
              title: "Northstar Industrial Technologies — Investor Overview",
              fileName: "Northstar_Investor_Overview_v3.3.pdf",
              notes: "",
              lastUpdatedBy: "Elena Hart",
            })
          }
        >
          <Plus className="mr-1.5 inline h-4 w-4" />
          Add deck
        </button>
      </header>
      <CorporateSection title="Deck versions">
        <div className="space-y-3">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <div>
                <p className="font-medium text-white">
                  v{deck.version} — {deck.title}
                </p>
                <p className="text-sm text-white/55">
                  {deck.fileName} · Updated {formatDateTime(deck.lastUpdatedAt)} by {deck.lastUpdatedBy}
                </p>
                {deck.notes ? <p className="mt-1 text-sm text-white/45">{deck.notes}</p> : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={corporateSecondaryButtonClass()}
                  onClick={() =>
                    setForm({
                      id: deck.id,
                      version: deck.version,
                      title: deck.title,
                      fileName: deck.fileName,
                      notes: deck.notes,
                      lastUpdatedBy: deck.lastUpdatedBy,
                    })
                  }
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={corporateSecondaryButtonClass()}
                  onClick={() => setDecks((prev) => prev.filter((d) => d.id !== deck.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CorporateSection>

      {form ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1524] p-5">
            <h3 className="text-lg font-semibold text-white">{form.id ? "Edit deck" : "New deck"}</h3>
            <div className="mt-4 space-y-3">
              {(["version", "title", "fileName", "lastUpdatedBy", "notes"] as const).map((field) => (
                <label key={field} className="block text-sm text-white/60">
                  {field}
                  <input
                    className={cn(corporateInputClass(), "mt-1 w-full")}
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  />
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={corporateSecondaryButtonClass()} onClick={() => setForm(null)}>
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

export function DemoFundraisingDataRoomsWorkspace() {
  const rooms = getNorthstarDataRooms();
  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Data Rooms</h1>
        <p className="mt-1 text-sm text-white/60">Northstar investor data rooms.</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-3">
        <CorporateKpiTile label="Active rooms" value={rooms.length} hint="Current investors" />
        <CorporateKpiTile
          label="Open access"
          value={rooms.filter((r) => r.status === "Open").length}
          hint="Full folder access"
        />
        <CorporateKpiTile
          label="Documents"
          value={rooms.reduce((sum, r) => sum + r.documents, 0)}
          hint="Across all rooms"
        />
      </section>
      <CorporateSection title="Investor data rooms">
        <div className={tableWrapClass()}>
          <table className="min-w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={thClass()}>Investor</th>
                <th className={thClass()}>Firm</th>
                <th className={thClass()}>Folder</th>
                <th className={thClass()}>Documents</th>
                <th className={thClass()}>Last updated</th>
                <th className={thClass()}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room: DataRoomRow) => (
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
                      <FolderOpen className="h-3.5 w-3.5" />
                      Open
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </td>
                  <td className={cn(tdClass(), "tabular-nums")}>{room.documents}</td>
                  <td className={tdClass()}>{formatDateTime(room.lastUpdatedAt)}</td>
                  <td className={tdClass()}>
                    <CorporateStatusPill>{room.status}</CorporateStatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CorporateSection>
    </div>
  );
}

export { default as DemoFundraisingCapTableWorkspace } from "@/components/demo/NorthstarCapTableWorkspace";
