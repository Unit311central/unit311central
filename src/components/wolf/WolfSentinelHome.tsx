"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { getInternalNavHref, type InternalOperationsView } from "@/lib/internal-operations-data";

const LINKS: Array<{
  label: string;
  detail: string;
  view: InternalOperationsView;
  query?: Record<string, string>;
}> = [
  {
    label: "Business Central",
    detail: "Unit311 clients, WOLF only",
    view: "clients",
  },
  {
    label: "Sales Management",
    detail: "Unit311 sales book, WOLF view",
    view: "sales-management",
    query: { tab: "dashboard", salesContext: "wolf" },
  },
  {
    label: "Operations",
    detail: "WOLF operations",
    view: "operations-dashboard",
  },
  {
    label: "Business Productivity",
    detail: "Linked from Unit311",
    view: "productivity-dashboard",
  },
  {
    label: "Support Desk",
    detail: "Unit311 tickets for WOLF clients",
    view: "support-overview",
  },
  {
    label: "Settings",
    detail: "Your profile",
    view: "profile",
  },
];

export default function WolfSentinelHome() {
  const basePath = useInternalOperationsBasePath();
  const [wolfClients, setWolfClients] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/clients?businessContext=wolf", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { clients?: unknown[] } | null) => {
        if (cancelled) return;
        setWolfClients(Array.isArray(payload?.clients) ? payload.clients.length : 0);
      })
      .catch(() => {
        if (!cancelled) setWolfClients(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-4 sm:py-6" aria-label="WOLF Sentinel home">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/80">
          WOLF Sentinel
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Home</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
          Unit311 Central modules for WOLF. Business Central, Sales, Business Productivity, and
          Support read the unit311 database. Operations stays the WOLF book.
        </p>
        <p className="mt-4 text-sm text-white/70">
          WOLF clients{" "}
          <span className="text-lg font-semibold tabular-nums text-white">
            {wolfClients == null ? "—" : wolfClients}
          </span>
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {LINKS.map((link) => (
          <Link
            key={link.label}
            href={getInternalNavHref(link.view, basePath, link.query)}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition-colors hover:border-sky-400/35 hover:bg-sky-500/[0.07]"
          >
            <p className="text-sm font-semibold text-white">{link.label}</p>
            <p className="mt-1 text-xs text-white/45">{link.detail}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
