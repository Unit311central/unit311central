"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import type { CrmLead, LeadStatus } from "@/lib/crm-data";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import {
  filterLeadsBySalesSegment,
  formatSalesMoney,
  isOpenPipelineLead,
} from "@/lib/sales-management-insights";

import { WsKpiTile, WsSection } from "../domain-workspace-ui";

const STAGE_ORDER: LeadStatus[] = ["Cold", "Warm", "Hot"];
const STAGE_COLORS: Record<LeadStatus, string> = {
  Cold: "#64748b",
  Warm: "#38bdf8",
  Hot: "#f97316",
  Won: "#22c55e",
  "Active Customer": "#a78bfa",
  Lost: "#ef4444",
};

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  return JSON.parse(text) as T;
}

export default function SalesManagementPipelineTab() {
  const basePath = useInternalOperationsBasePath();
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/crm/leads", { cache: "no-store" });
      const data = await readApiJson<{ leads?: CrmLead[]; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to load pipeline");
      setLeads(data.leads ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pipelineLeads = useMemo(() => filterLeadsBySalesSegment(leads, "pipeline"), [leads]);
  const pipelineValue = useMemo(
    () => pipelineLeads.reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0),
    [pipelineLeads],
  );
  const chartData = useMemo(
    () =>
      STAGE_ORDER.map((status) => ({
        stage: status,
        count: pipelineLeads.filter((lead) => lead.status === status).length,
        value: pipelineLeads
          .filter((lead) => lead.status === status)
          .reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0),
      })),
    [pipelineLeads],
  );

  const wonCount = leads.filter((lead) => lead.status === "Won").length;
  const lostCount = leads.filter((lead) => lead.status === "Lost").length;

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center text-white/60">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading pipeline…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <WsKpiTile label="Open pipeline" value={formatSalesMoney(pipelineValue)} hint="Cold, warm, and hot value" />
        <WsKpiTile label="Open deals" value={String(pipelineLeads.length)} hint="Active pipeline records" />
        <WsKpiTile label="Won" value={String(wonCount)} hint="Closed-won CRM leads" />
        <WsKpiTile label="Lost" value={String(lostCount)} hint="Closed-lost CRM leads" />
      </div>

      <WsSection title="Pipeline funnel" subtitle="Analytical view over existing CRM leads — single source of truth">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="stage" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-xs text-white">
                      <div className="font-medium">{label}</div>
                      <div>{payload[0]?.value} opportunities</div>
                      <div>{formatSalesMoney(Number(payload[1]?.value ?? 0))}</div>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </WsSection>

      <div className="grid gap-4 xl:grid-cols-3">
        {STAGE_ORDER.map((status) => {
          const columnLeads = pipelineLeads.filter((lead) => lead.status === status);
          return (
            <WsSection
              key={status}
              title={status}
              subtitle={`${columnLeads.length} open · ${formatSalesMoney(
                columnLeads.reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0),
              )}`}
            >
              <div className="space-y-2">
                {columnLeads.length ? (
                  columnLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={getInternalNavHref("sales-management", basePath, {
                        tab: "opportunities",
                        leadId: lead.id,
                      })}
                      className="block rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition-colors hover:border-violet-400/30 hover:bg-violet-500/10"
                    >
                      <p className="text-sm font-medium text-white">{lead.companyName}</p>
                      <p className="text-[11px] text-white/45">{lead.contactName}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-violet-200">
                          {lead.estimatedValue ? formatSalesMoney(lead.estimatedValue) : "—"}
                        </span>
                        <span className="text-white/40">{lead.nextActionDate ?? "No date"}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="py-4 text-center text-xs text-white/40">No {status.toLowerCase()} opportunities.</p>
                )}
              </div>
            </WsSection>
          );
        })}
      </div>

      <p className="text-[11px] text-white/35">
        Pipeline reads from the same `crm_leads` records used by Business Central → Customer Management.
        {leads.some((lead) => !isOpenPipelineLead(lead.status))
          ? ` ${wonCount + lostCount} closed records are excluded from the open pipeline columns.`
          : ""}
      </p>
    </div>
  );
}
