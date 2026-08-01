"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Users } from "lucide-react";

import type { BoardDirector } from "@/lib/board-directors-service";
import {
  CorporateKpiTile,
  CorporateSection,
  corporateInputClass,
} from "./corporate-ui";

export default function BoardDirectorsWorkspace() {
  const [directors, setDirectors] = useState<BoardDirector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/board-directors", { credentials: "include" });
        const data = (await res.json()) as { directors?: BoardDirector[]; error?: string };
        if (!res.ok) throw new Error(data.error || "Failed to load board directors.");
        if (!cancelled) setDirectors(data.directors ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load board directors.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return directors;
    return directors.filter((d) =>
      [d.fullName, d.roleTitle, d.organisation, d.email ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [directors, search]);

  return (
    <div className="space-y-4">
      <CorporateSection
        title="Board of Directors"
        description="Governance board members for this organisation."
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <CorporateKpiTile label="Directors" value={String(directors.length)} />
          <CorporateKpiTile
            label="With organisation"
            value={String(directors.filter((d) => d.organisation).length)}
          />
          <CorporateKpiTile label="Showing" value={String(filtered.length)} />
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <Search className="h-4 w-4 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search directors…"
            className={`${corporateInputClass} border-0 bg-transparent px-0`}
          />
        </div>

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading board…
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </p>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-white/30" />
            <p className="text-sm text-white/55">No board directors found.</p>
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
                <tr>
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Role / title</th>
                  <th className="px-3 py-2.5">Organisation</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-t border-white/8 text-white/80">
                    <td className="px-3 py-2.5 font-medium text-white">{d.fullName}</td>
                    <td className="px-3 py-2.5">{d.roleTitle || "—"}</td>
                    <td className="px-3 py-2.5">{d.organisation || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CorporateSection>
    </div>
  );
}
