"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  Trash2,
} from "lucide-react";

import type { TqmsReport } from "@/lib/tqms-data";
import { tqmsStatusClass } from "@/lib/tqms-data";
import { createReport, deleteReport } from "@/lib/tqms-mock-store";
import { useTqmsMockStore } from "./useTqmsMockStore";
import {
  TqmsEmpty,
  TqmsSection,
  TqmsStatusPill,
  tqmsInputClass,
  tqmsLabelClass,
  tqmsPrimaryButtonClass,
  tqmsSecondaryButtonClass,
} from "./tqms-ui";

const REPORT_KINDS: TqmsReport["kind"][] = [
  "Training",
  "Compliance",
  "Audit",
  "CAPA",
  "Certificate",
  "Learning",
];

const REPORT_FORMATS: TqmsReport["format"][] = ["PDF", "Excel", "CSV"];

function formatTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function defaultReportName(kind: TqmsReport["kind"]) {
  const date = new Date().toLocaleDateString("en-GB");
  return `${kind} Report — ${date}`;
}

function downloadStub(report: TqmsReport) {
  const content = [
    `Unit311 QMS Report`,
    `Name: ${report.name}`,
    `Kind: ${report.kind}`,
    `Format: ${report.format}`,
    `Generated: ${report.createdAt}`,
    `Created by: ${report.createdBy}`,
    "",
    "Sample export data — connect to live reporting service in production.",
  ].join("\n");
  const mime =
    report.format === "PDF"
      ? "application/pdf"
      : report.format === "Excel"
        ? "application/vnd.ms-excel"
        : "text/csv";
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${report.name.replace(/\s+/g, "-").toLowerCase()}.${report.format === "Excel" ? "xlsx" : report.format.toLowerCase()}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatIcon(format: TqmsReport["format"]) {
  if (format === "PDF") return FileText;
  if (format === "Excel") return FileSpreadsheet;
  return Download;
}

export default function TqmsReportsWorkspace() {
  const store = useTqmsMockStore();
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<TqmsReport["kind"] | "All">("All");
  const [selectedKind, setSelectedKind] = useState<TqmsReport["kind"]>("Training");
  const [selectedFormat, setSelectedFormat] = useState<TqmsReport["format"]>("PDF");
  const [reportName, setReportName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return store.reports.filter((report) => {
      if (kindFilter !== "All" && report.kind !== kindFilter) return false;
      if (!q) return true;
      return (
        report.name.toLowerCase().includes(q) ||
        report.kind.toLowerCase().includes(q) ||
        report.createdBy.toLowerCase().includes(q)
      );
    });
  }, [store.reports, search, kindFilter]);

  function handleGenerate() {
    const name = reportName.trim() || defaultReportName(selectedKind);
    createReport({
      name,
      kind: selectedKind,
      format: selectedFormat,
      createdBy: "Quality Operations",
    });
    setNotice(`${selectedFormat} report "${name}" saved to history.`);
    setReportName("");
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <TqmsSection
        title="Generate Report"
        subtitle="Export training, compliance, audit, CAPA, certificate, and learning data."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className={tqmsLabelClass()}>Report Kind</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {REPORT_KINDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setSelectedKind(kind)}
                  className={
                    selectedKind === kind
                      ? tqmsPrimaryButtonClass()
                      : tqmsSecondaryButtonClass()
                  }
                >
                  {kind}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className={tqmsLabelClass()}>Output Format</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {REPORT_FORMATS.map((format) => {
                const Icon = formatIcon(format);
                return (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setSelectedFormat(format)}
                    className={
                      selectedFormat === format
                        ? tqmsPrimaryButtonClass()
                        : tqmsSecondaryButtonClass()
                    }
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {format}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <label className="mt-4 block">
          <span className={tqmsLabelClass()}>Report Name (optional)</span>
          <input
            className={tqmsInputClass()}
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            placeholder={defaultReportName(selectedKind)}
          />
        </label>
        <div className="mt-4">
          <button type="button" className={tqmsPrimaryButtonClass()} onClick={handleGenerate}>
            Generate {selectedFormat}
          </button>
        </div>
      </TqmsSection>

      <TqmsSection
        title="Report History"
        subtitle="Previously generated exports stored for download and audit trail."
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports…"
              className={`${tqmsInputClass()} mt-0 pl-9`}
            />
          </div>
          <select
            value={kindFilter}
            onChange={(e) =>
              setKindFilter(e.target.value as TqmsReport["kind"] | "All")
            }
            className={`${tqmsInputClass()} mt-0 w-auto min-w-[160px]`}
          >
            <option value="All">All kinds</option>
            {REPORT_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <TqmsEmpty message="No reports match your filters." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-[0.12em] text-white/45">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Name</th>
                  <th className="px-3 py-2.5 font-medium">Kind</th>
                  <th className="px-3 py-2.5 font-medium">Format</th>
                  <th className="px-3 py-2.5 font-medium">Created</th>
                  <th className="px-3 py-2.5 font-medium">Created By</th>
                  <th className="px-3 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((report) => {
                  const Icon = formatIcon(report.format);
                  return (
                    <tr key={report.id} className="hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5 font-medium text-white">{report.name}</td>
                      <td className="px-3 py-2.5">
                        <TqmsStatusPill className={tqmsStatusClass(report.kind)}>
                          {report.kind}
                        </TqmsStatusPill>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1 text-white/70">
                          <Icon className="h-3.5 w-3.5 text-white/40" />
                          {report.format}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-white/60">
                        {formatTimestamp(report.createdAt)}
                      </td>
                      <td className="px-3 py-2.5 text-white/70">{report.createdBy}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-sky-400/40 bg-sky-500/15 px-2 text-[11px] font-semibold text-sky-100 transition-colors hover:bg-sky-500/25"
                            onClick={() => {
                              downloadStub(report);
                              setNotice(`Downloaded ${report.name}.`);
                            }}
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-400/40 bg-rose-500/15 px-2 text-[11px] font-semibold text-rose-100 transition-colors hover:bg-rose-500/25"
                            onClick={() => {
                              if (window.confirm(`Delete report "${report.name}"?`)) {
                                deleteReport(report.id);
                                setNotice(`Report "${report.name}" deleted.`);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TqmsSection>
    </div>
  );
}
