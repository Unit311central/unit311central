"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, Upload, X } from "lucide-react";

import {
  TARGET_CLIENTS_IMPORT_MAX_FILE_BYTES,
  TARGET_CLIENT_IMPORT_FIELD_LABELS,
  TARGET_CLIENT_IMPORT_FIELDS,
  rejectedRowsToCsv,
  suggestColumnMapping,
  type ImportRowPreview,
  type TargetClientImportField,
} from "@/lib/target-clients-import";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "file", title: "Select file" },
  { id: "map", title: "Map columns" },
  { id: "preview", title: "Preview & validate" },
  { id: "review", title: "Confirm import" },
  { id: "done", title: "Complete" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function statusBadge(status: ImportRowPreview["status"]) {
  switch (status) {
    case "ready":
      return "text-emerald-200 bg-emerald-500/15 border-emerald-400/25";
    case "error":
      return "text-red-200 bg-red-500/15 border-red-400/25";
    case "duplicate_crm":
    case "duplicate_file":
      return "text-amber-200 bg-amber-500/15 border-amber-400/25";
    default:
      return "text-white/60 bg-white/5 border-white/10";
  }
}

export type TargetClientsImportWizardProps = {
  open: boolean;
  onClose: () => void;
  onImported: () => void | Promise<void>;
};

export default function TargetClientsImportWizard({
  open,
  onClose,
  onImported,
}: TargetClientsImportWizardProps) {
  const [step, setStep] = useState<StepId>("file");
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Partial<Record<TargetClientImportField, number>>>({});
  const [previews, setPreviews] = useState<ImportRowPreview[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    ready: number;
    duplicateCrm: number;
    duplicateFile: number;
    errors: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    skippedCount: number;
  } | null>(null);

  const reset = useCallback(() => {
    setStep("file");
    setFile(null);
    setSheetNames([]);
    setSelectedSheet("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setPreviews([]);
    setSummary(null);
    setBusy(false);
    setError(null);
    setImportResult(null);
  }, []);

  const handleClose = useCallback(() => {
    if (busy) return;
    reset();
    onClose();
  }, [busy, onClose, reset]);

  const parseFile = useCallback(
    async (selectedFile: File, sheet?: string) => {
      setBusy(true);
      setError(null);
      try {
        const form = new FormData();
        form.append("file", selectedFile);
        if (sheet) form.append("sheet", sheet);
        const response = await fetch("/api/sales-management/target-clients/import/parse", {
          method: "POST",
          body: form,
        });
        const body = (await response.json()) as {
          error?: string;
          headers?: string[];
          rows?: string[][];
          sheetNames?: string[];
        };
        if (!response.ok) throw new Error(body.error ?? "Could not read file");
        const nextHeaders = body.headers ?? [];
        const nextRows = body.rows ?? [];
        setHeaders(nextHeaders);
        setRows(nextRows);
        setSheetNames(body.sheetNames ?? []);
        setMapping(suggestColumnMapping(nextHeaders));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not read file");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const onFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selected = event.target.files?.[0] ?? null;
      setFile(selected);
      setError(null);
      setHeaders([]);
      setRows([]);
      setSheetNames([]);
      setSelectedSheet("");
      if (!selected) return;
      if (selected.size > TARGET_CLIENTS_IMPORT_MAX_FILE_BYTES) {
        setError(
          `File exceeds ${Math.round(TARGET_CLIENTS_IMPORT_MAX_FILE_BYTES / (1024 * 1024))} MB.`,
        );
        return;
      }
      await parseFile(selected);
    },
    [parseFile],
  );

  const loadPreview = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/sales-management/target-clients/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headers, rows, mapping }),
      });
      const body = (await response.json()) as {
        error?: string;
        previews?: ImportRowPreview[];
        summary?: typeof summary;
      };
      if (!response.ok) throw new Error(body.error ?? "Preview failed");
      setPreviews(body.previews ?? []);
      setSummary(body.summary ?? null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
      return false;
    } finally {
      setBusy(false);
    }
  }, [headers, mapping, rows]);

  const readyRows = useMemo(
    () => previews.filter((p) => p.status === "ready"),
    [previews],
  );

  const runImport = useCallback(async () => {
    if (busy || readyRows.length === 0) return;
    setBusy(true);
    setError(null);
    setStep("review");
    try {
      const response = await fetch("/api/sales-management/target-clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: readyRows.map((p) => ({
            sourceRowNumber: p.sourceRowNumber,
            ...p.values,
          })),
        }),
      });
      const body = (await response.json()) as {
        error?: string;
        importedCount?: number;
        skippedCount?: number;
      };
      if (!response.ok) throw new Error(body.error ?? "Import failed");
      setImportResult({
        importedCount: body.importedCount ?? 0,
        skippedCount: body.skippedCount ?? 0,
      });
      setStep("done");
      await onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }, [busy, onImported, readyRows]);

  const downloadRejected = useCallback(() => {
    const csv = rejectedRowsToCsv(previews, headers, rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "target-clients-import-rejected.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }, [headers, previews, rows]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const mappingValid = mapping.companyName != null && mapping.companyName >= 0;

  const usedColumns = useMemo(() => {
    const used = new Map<number, TargetClientImportField>();
    for (const field of TARGET_CLIENT_IMPORT_FIELDS) {
      const idx = mapping[field];
      if (idx != null && idx >= 0) used.set(idx, field);
    }
    return used;
  }, [mapping]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tc-import-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a1220] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h2 id="tc-import-title" className="text-lg font-semibold text-white">
              Import Target Clients
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Step {Math.min(stepIndex + 1, STEPS.length)} of {STEPS.length}:{" "}
              {STEPS[stepIndex]?.title ?? "Complete"}
            </p>
            <ol className="mt-2 flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-wide text-white/35">
              {STEPS.map((s, i) => (
                <li
                  key={s.id}
                  className={cn(
                    "rounded px-2 py-0.5",
                    i <= stepIndex ? "bg-violet-500/20 text-violet-100" : "bg-white/5",
                  )}
                >
                  {s.title}
                </li>
              ))}
            </ol>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={handleClose}
            className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/5 disabled:opacity-50"
            aria-label="Close import wizard"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {error ? (
            <p className="mb-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          {step === "file" ? (
            <div className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-6 py-10 text-center hover:border-violet-400/40">
                <Upload className="mb-2 h-8 w-8 text-violet-300/80" strokeWidth={1.5} />
                <span className="text-sm font-medium text-white">Choose CSV or Excel (.xlsx)</span>
                <span className="mt-1 text-xs text-white/45">
                  Max {Math.round(TARGET_CLIENTS_IMPORT_MAX_FILE_BYTES / (1024 * 1024))} MB · Legacy .xls
                  not supported
                </span>
                <input
                  type="file"
                  accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="sr-only"
                  onChange={(e) => void onFileChange(e)}
                />
              </label>
              {file ? (
                <p className="text-sm text-white/70">
                  <span className="font-medium text-white">{file.name}</span> · {formatBytes(file.size)}
                </p>
              ) : null}
              {sheetNames.length > 1 ? (
                <label className="block text-sm text-white/70">
                  Worksheet
                  <select
                    value={selectedSheet || sheetNames[0]}
                    onChange={(e) => {
                      const sheet = e.target.value;
                      setSelectedSheet(sheet);
                      if (file) void parseFile(file, sheet);
                    }}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-[13px] text-white"
                  >
                    {sheetNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {headers.length > 0 ? (
                <p className="text-xs text-emerald-200/90">
                  Found {rows.length} data row{rows.length === 1 ? "" : "s"} and {headers.length}{" "}
                  column{headers.length === 1 ? "" : "s"}.
                </p>
              ) : null}
            </div>
          ) : null}

          {step === "map" ? (
            <div className="space-y-4">
              {!mappingValid ? (
                <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                  Map the required Company Name column before continuing.
                </p>
              ) : null}
              <div className="space-y-3">
                {TARGET_CLIENT_IMPORT_FIELDS.map((field) => {
                  const col = mapping[field];
                  const sample =
                    col != null && col >= 0 && rows[0]
                      ? (rows[0][col] ?? "").slice(0, 80) || "—"
                      : "—";
                  return (
                    <div
                      key={field}
                      className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3 sm:grid-cols-[180px_1fr_140px]"
                    >
                      <span className="text-sm font-medium text-white">
                        {TARGET_CLIENT_IMPORT_FIELD_LABELS[field]}
                        {field === "companyName" ? " *" : ""}
                      </span>
                      <select
                        value={col ?? -1}
                        onChange={(e) => {
                          const idx = Number(e.target.value);
                          setMapping((prev) => {
                            const next = { ...prev };
                            if (idx < 0) {
                              delete next[field];
                              return next;
                            }
                            for (const other of TARGET_CLIENT_IMPORT_FIELDS) {
                              if (other !== field && next[other] === idx) delete next[other];
                            }
                            next[field] = idx;
                            return next;
                          });
                        }}
                        className="rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-[13px] text-white"
                      >
                        <option value={-1}>— Not mapped —</option>
                        {headers.map((header, idx) => (
                          <option key={`${header}-${idx}`} value={idx} disabled={usedColumns.has(idx) && usedColumns.get(idx) !== field}>
                            {header || `Column ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                      <span className="truncate text-xs text-white/45" title={sample}>
                        Sample: {sample}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {(step === "preview" || step === "review") && previews.length > 0 ? (
            <div className="space-y-3">
              {summary ? (
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                  {[
                    ["Total", summary.total],
                    ["Ready", summary.ready],
                    ["CRM duplicates", summary.duplicateCrm],
                    ["File duplicates", summary.duplicateFile],
                    ["Errors", summary.errors],
                  ].map(([label, count]) => (
                    <div
                      key={String(label)}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-center"
                    >
                      <div className="text-lg font-semibold text-white">{count}</div>
                      <div className="text-white/45">{label}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="min-w-full text-left text-[12px]">
                  <thead className="bg-white/[0.04] text-[10px] uppercase text-white/40">
                    <tr>
                      <th className="px-2 py-2">Row</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Company</th>
                      <th className="px-2 py-2">Website</th>
                      <th className="px-2 py-2">Email</th>
                      <th className="px-2 py-2">Client notes</th>
                      <th className="px-2 py-2">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previews.map((p) => (
                      <tr key={p.sourceRowNumber} className="border-t border-white/10 text-white/75">
                        <td className="px-2 py-1.5">{p.sourceRowNumber}</td>
                        <td className="px-2 py-1.5">
                          <span
                            className={cn(
                              "inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium",
                              statusBadge(p.status),
                            )}
                          >
                            {p.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="max-w-[120px] truncate px-2 py-1.5">{p.values.companyName || "—"}</td>
                        <td className="max-w-[120px] truncate px-2 py-1.5">
                          {p.normalizedWebsite || p.values.website || "—"}
                        </td>
                        <td className="max-w-[140px] truncate px-2 py-1.5">{p.values.email || "—"}</td>
                        <td className="max-w-[160px] truncate px-2 py-1.5 text-white/55" title={p.values.notes}>
                          {p.values.notes
                            ? p.values.notes.length > 80
                              ? `${p.values.notes.slice(0, 80)}…`
                              : p.values.notes
                            : "—"}
                        </td>
                        <td className="max-w-[200px] truncate px-2 py-1.5 text-white/50">
                          {p.messages.join(" ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {step === "review" ? (
                <p className="text-sm text-white/60">
                  {readyRows.length === 0
                    ? "No eligible records to import. Fix the spreadsheet or mapping and try again."
                    : `${readyRows.length} new target client${readyRows.length === 1 ? "" : "s"} will be created. Duplicates and invalid rows are excluded.`}
                </p>
              ) : null}
            </div>
          ) : null}

          {step === "done" && importResult ? (
            <div className="space-y-4">
              <p className="text-sm text-white/80">
                Successfully imported{" "}
                <span className="font-semibold text-emerald-200">{importResult.importedCount}</span>{" "}
                target client{importResult.importedCount === 1 ? "" : "s"}.
                {importResult.skippedCount > 0
                  ? ` ${importResult.skippedCount} row(s) were skipped during save.`
                  : null}
              </p>
              {summary && summary.errors + summary.duplicateCrm + summary.duplicateFile > 0 ? (
                <button
                  type="button"
                  onClick={downloadRejected}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
                >
                  <Download className="h-4 w-4" />
                  Download rejected rows (CSV)
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-5 py-3">
          <button
            type="button"
            disabled={busy || step === "done"}
            onClick={() => {
              if (step === "file") handleClose();
              else if (step === "map") setStep("file");
              else if (step === "preview") setStep("map");
              else if (step === "review") setStep("preview");
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/75 hover:bg-white/5 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === "file" ? "Cancel" : "Back"}
          </button>

          <div className="flex gap-2">
            {step === "file" ? (
              <button
                type="button"
                disabled={busy || !file || headers.length === 0}
                onClick={() => setStep("map")}
                className="inline-flex items-center gap-1 rounded-lg border border-violet-400/35 bg-violet-500/20 px-4 py-2 text-sm font-semibold text-violet-50 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : null}
            {step === "map" ? (
              <button
                type="button"
                disabled={busy || !mappingValid}
                onClick={() => void loadPreview().then((ok) => ok && setStep("preview"))}
                className="inline-flex items-center gap-1 rounded-lg border border-violet-400/35 bg-violet-500/20 px-4 py-2 text-sm font-semibold text-violet-50 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Preview
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : null}
            {step === "preview" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep("review")}
                className="inline-flex items-center gap-1 rounded-lg border border-violet-400/35 bg-violet-500/20 px-4 py-2 text-sm font-semibold text-violet-50"
              >
                Review
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : null}
            {step === "review" ? (
              <button
                type="button"
                disabled={busy || readyRows.length === 0}
                onClick={() => void runImport()}
                className="inline-flex items-center gap-1 rounded-lg border border-violet-400/35 bg-violet-500/25 px-4 py-2 text-sm font-semibold text-violet-50 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Import {readyRows.length} Target Client{readyRows.length === 1 ? "" : "s"}
              </button>
            ) : null}
            {step === "done" ? (
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-violet-400/35 bg-violet-500/20 px-4 py-2 text-sm font-semibold text-violet-50"
              >
                Close
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  );
}
