"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ClipboardList,
  FileText,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { computeTrainingDashboardKpis } from "@/lib/tqms-mock-store";
import {
  TQMS_AUDIT_STATUSES,
  TQMS_CAPA_STATUSES,
  TQMS_DOC_STATUSES,
} from "@/lib/tqms-data";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import { useInternalOperationsBasePath } from "./InternalOperationsBasePathContext";
import { useTqmsMockStore } from "./useTqmsMockStore";
import { TqmsKpiTile, TqmsSection, tqmsSecondaryButtonClass } from "./tqms-ui";

const CHART_COLORS = ["#38bdf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#94a3b8"];

function countByStatus<T extends string>(
  items: readonly { status: T }[],
  statuses: readonly T[],
) {
  return statuses.map((status) => ({
    name: status,
    value: items.filter((item) => item.status === status).length,
  }));
}

const MODULE_LINKS = [
  {
    label: "Document Control",
    view: "qms-document-control" as const,
    icon: FileText,
    hint: "Controlled documents & approvals",
  },
  {
    label: "CAPA",
    view: "qms-capa" as const,
    icon: Stethoscope,
    hint: "Corrective & preventive actions",
  },
  {
    label: "Internal Audits",
    view: "qms-internal-audits" as const,
    icon: ClipboardList,
    hint: "Schedule audits & findings",
  },
  {
    label: "QMS Reports",
    view: "qms-reports" as const,
    icon: ShieldCheck,
    hint: "Compliance & audit reports",
  },
];

export default function QualityManagementWorkspace() {
  const basePath = useInternalOperationsBasePath();
  const store = useTqmsMockStore();

  const trainingKpis = useMemo(() => computeTrainingDashboardKpis(store), [store]);

  const kpis = useMemo(() => {
    const controlledDocuments = store.documents.filter((d) => d.status === "Approved").length;
    const openCapas = store.capas.filter((c) => c.status !== "Closed").length;
    const internalAudits = store.audits.filter(
      (a) => !a.title.toLowerCase().includes("supplier"),
    ).length;
    const approvedDocs = store.documents.filter((d) => d.status === "Approved").length;
    const docCompliance =
      store.documents.length === 0
        ? 100
        : Math.round((approvedDocs / store.documents.length) * 100);
    const complianceScore = Math.round((trainingKpis.complianceScore + docCompliance) / 2);

    return { controlledDocuments, openCapas, internalAudits, complianceScore };
  }, [store, trainingKpis.complianceScore]);

  const docChart = useMemo(
    () => countByStatus(store.documents, TQMS_DOC_STATUSES),
    [store.documents],
  );
  const capaChart = useMemo(
    () => countByStatus(store.capas, TQMS_CAPA_STATUSES),
    [store.capas],
  );
  const auditChart = useMemo(
    () => countByStatus(store.audits, TQMS_AUDIT_STATUSES),
    [store.audits],
  );

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TqmsKpiTile label="Controlled Documents" value={kpis.controlledDocuments} />
        <TqmsKpiTile label="Open CAPAs" value={kpis.openCapas} />
        <TqmsKpiTile label="Internal Audits" value={kpis.internalAudits} />
        <TqmsKpiTile label="Compliance Score" value={`${kpis.complianceScore}%`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <TqmsSection title="Document Status" subtitle="Register by approval state">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={docChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0b1524",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {docChart.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TqmsSection>

        <TqmsSection title="CAPA Pipeline" subtitle="Open vs closed actions">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={capaChart.filter((d) => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {capaChart.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0b1524",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/55">
            {capaChart.map((item, index) => (
              <li key={item.name} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                {item.name} ({item.value})
              </li>
            ))}
          </ul>
        </TqmsSection>

        <TqmsSection title="Audit Schedule" subtitle="Internal audit status">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={auditChart} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={88}
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0b1524",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {auditChart.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TqmsSection>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MODULE_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.view}
              href={getInternalNavHref(link.view, basePath)}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-sky-400/30 hover:bg-sky-500/5"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-white/10 bg-[#0b1524]/80 p-2 text-sky-300">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-semibold text-white group-hover:text-sky-100">{link.label}</span>
              </div>
              <p className="mt-2 text-xs text-white/45">{link.hint}</p>
              <span className={`${tqmsSecondaryButtonClass()} mt-3 inline-flex`}>Open module</span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
