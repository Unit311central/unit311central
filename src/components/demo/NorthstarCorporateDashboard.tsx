"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Building2, FileText, Landmark, MapPin, Pencil } from "lucide-react";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { useCorporateMockStore } from "@/components/testflighthub/useCorporateMockStore";
import { CorporateKpiTile, CorporateSection, corporateSecondaryButtonClass } from "@/components/testflighthub/corporate-ui";
import { getInternalNavHref, type InternalOperationsView } from "@/lib/internal-operations-data";
import { cn } from "@/lib/utils";

const TILE_STORAGE_KEY = "northstar-corporate-dashboard-tiles-v1";

type DashboardTile = {
  id: string;
  label: string;
  value: string;
  hint: string;
  href: InternalOperationsView;
};

function buildDefaultTiles(store: ReturnType<typeof useCorporateMockStore>): DashboardTile[] {
  return [
    {
      id: "offices",
      label: "Office locations",
      value: String(store.offices.length),
      hint: "UK, US & EU sites",
      href: "office-locations",
    },
    {
      id: "banks",
      label: "Bank accounts",
      value: String(store.banks.length),
      hint: "Wise treasury (simulated)",
      href: "corporate-bank-accounts",
    },
    {
      id: "advisors",
      label: "Professional advisors",
      value: String(store.advisors.length),
      hint: "Lawyers, accountants, auditors",
      href: "corporate-advisers",
    },
    {
      id: "contracts",
      label: "Active contracts",
      value: String(store.contracts.filter((c) => c.status === "active").length),
      hint: "MSAs, NDAs, supplier agreements",
      href: "corporate-contracts",
    },
    {
      id: "licences",
      label: "Software licences",
      value: String(store.licences.length),
      hint: "SaaS & tooling register",
      href: "technology-software",
    },
    {
      id: "company",
      label: "Company information",
      value: "Profile",
      hint: "Registration, VAT, DUNS, contacts",
      href: "corporate-company-details",
    },
  ];
}

export default function NorthstarCorporateDashboard() {
  const basePath = useInternalOperationsBasePath();
  const store = useCorporateMockStore();
  const [editing, setEditing] = useState(false);
  const defaultTiles = useMemo(() => buildDefaultTiles(store), [store]);
  const [tiles, setTiles] = useState<DashboardTile[]>(defaultTiles);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TILE_STORAGE_KEY);
      if (!raw) {
        setTiles(buildDefaultTiles(store));
        return;
      }
      const parsed = JSON.parse(raw) as DashboardTile[];
      if (Array.isArray(parsed) && parsed.length > 0) setTiles(parsed);
    } catch {
      setTiles(buildDefaultTiles(store));
    }
  }, [store]);

  const saveTiles = useCallback((next: DashboardTile[]) => {
    setTiles(next);
    try {
      localStorage.setItem(TILE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const href = (view: InternalOperationsView) => getInternalNavHref(view, basePath);

  const quickActions = [
    { label: "Company information", href: href("corporate-company-details"), icon: Building2 },
    { label: "Add office", href: href("office-locations"), icon: MapPin },
    { label: "Add bank account", href: href("corporate-bank-accounts"), icon: Landmark },
    { label: "Add advisor", href: href("corporate-advisers"), icon: Briefcase },
    { label: "Add contract", href: href("corporate-contracts"), icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Corporate Information</h1>
          <p className="mt-1 text-sm text-white/60">Northstar entity profile, offices, advisors, and records.</p>
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
            <Link key={tile.id} href={href(tile.href)} className="block transition hover:opacity-90">
              <CorporateKpiTile label={tile.label} value={tile.value} hint={tile.hint} />
            </Link>
          ),
        )}
      </div>

      <CorporateSection title="Quick actions">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className={corporateSecondaryButtonClass()}>
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </Link>
          ))}
        </div>
      </CorporateSection>
    </div>
  );
}
