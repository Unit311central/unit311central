"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Box,
  Download,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Layers3,
  Plus,
  Search,
  Upload,
} from "lucide-react";

import {
  TECHNICAL_FILE_CATEGORIES,
  TECHNICAL_FILE_STATUSES,
  formatTechnicalFileSize,
} from "@/lib/engineering-technical-files/file-types";
import {
  addTechnicalFileVersionApi,
  archiveTechnicalFileApi,
  createEngineeringMasterApi,
  createTechnicalFileApi,
  getTechnicalFileApi,
  getTechnicalFileDownloadUrlApi,
  listEngineeringMastersApi,
  listTechnicalFilesApi,
  prepareTechnicalFileUploadApi,
  restoreTechnicalFileVersionApi,
  updateTechnicalFileApi,
  uploadTechnicalFileBlob,
} from "@/lib/engineering-technical-files/client-api";
import type {
  EngineeringMaster,
  TechnicalFileDetail,
  TechnicalFileListItem,
} from "@/lib/engineering-technical-files/types";
import TechnicalFilePreview from "./engineering-technical-files/TechnicalFilePreview";
import {
  WsEmpty,
  WsInputClass,
  WsPrimaryButtonClass,
  WsSecondaryButtonClass,
  WsSection,
  WsStatusPill,
} from "./domain-workspace-ui";

function fileIcon(kind: string) {
  if (kind === "model_3d" || kind === "cad") return Box;
  if (kind === "image") return FileImage;
  if (kind === "spreadsheet") return FileSpreadsheet;
  if (kind === "pdf" || kind === "document" || kind === "presentation") return FileText;
  return FileCode2;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EngineeringTechnicalFilesWorkspace() {
  const [files, setFiles] = useState<TechnicalFileListItem[]>([]);
  const [masters, setMasters] = useState<EngineeringMaster[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TechnicalFileDetail | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [masterFilter, setMasterFilter] = useState("All");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const refreshList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextFiles, nextMasters] = await Promise.all([
        listTechnicalFilesApi({
          search,
          category: categoryFilter,
          status: statusFilter,
          masterId: masterFilter !== "All" ? masterFilter : undefined,
        }),
        listEngineeringMastersApi(),
      ]);
      setFiles(nextFiles);
      setMasters(nextMasters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load technical files.");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter, masterFilter]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setPreviewUrl(null);
    try {
      const file = await getTechnicalFileApi(id);
      setDetail(file);
      const current = file.versions.find((v) => v.isCurrent) ?? file.versions[0];
      if (current) {
        const dl = await getTechnicalFileDownloadUrlApi(id, current.id);
        setPreviewUrl(dl.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file detail.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else {
      setDetail(null);
      setPreviewUrl(null);
    }
  }, [selectedId, loadDetail]);

  const relatedFiles = useMemo(() => {
    if (!detail) return [];
    const relIds = detail.relationships
      .filter((r) => r.targetType === "technical_file")
      .map((r) => r.targetId);
    return files.filter((f) => relIds.includes(f.id));
  }, [detail, files]);

  async function handleArchive() {
    if (!detail) return;
    setBusy(true);
    try {
      await archiveTechnicalFileApi(detail.id);
      setNotice("Technical file archived.");
      setSelectedId(null);
      await refreshList();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Archive failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <WsSection
        title="Technical Files"
        subtitle="Engineering technical documentation, CAD, 3D models, drawings and controlled files."
        actions={
          <button type="button" className={WsPrimaryButtonClass()} onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" />
            Upload Technical File
          </button>
        }
      >
        <div />
      </WsSection>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className={`${WsInputClass()} pl-10`}
                placeholder="Search technical files…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <select className={WsInputClass()} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="All">All categories</option>
                {TECHNICAL_FILE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select className={WsInputClass()} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All statuses</option>
                {TECHNICAL_FILE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select className={WsInputClass()} value={masterFilter} onChange={(e) => setMasterFilter(e.target.value)}>
                <option value="All">All masters</option>
                {masters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-8 text-sm text-slate-400">
              Loading technical files…
            </div>
          ) : files.length === 0 ? (
            <div className="space-y-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center">
              <WsEmpty message="No technical files yet. Upload CAD models, drawings, specifications, test reports and other engineering documents to build your technical library." />
              <button type="button" className={WsPrimaryButtonClass()} onClick={() => setUploadOpen(true)}>
                <Upload className="h-4 w-4" />
                Upload Technical File
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => {
                const Icon = fileIcon(file.fileKind);
                const active = selectedId === file.id;
                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setSelectedId(file.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-teal-400/40 bg-teal-500/10"
                        : "border-white/10 bg-slate-950/40 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                          <Icon className="h-5 w-5 text-teal-300" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{file.title}</div>
                          <div className="mt-1 text-sm text-slate-400">
                            {file.category} · {(file.currentExtension ?? "file").toUpperCase()}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {file.currentRevision ? `Rev ${file.currentRevision}` : "No revision"} ·{" "}
                            {file.status}
                            {file.masterTitle ? ` · Master: ${file.masterTitle}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <div>Updated {formatDate(file.updatedAt)}</div>
                        <div>{formatTechnicalFileSize(file.currentSizeBytes)}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          {!selectedId || !detail ? (
            <div className="flex min-h-[480px] flex-col items-center justify-center gap-3 text-center text-sm text-slate-400">
              <Layers3 className="h-10 w-10 text-slate-600" />
              Select a technical file to view details, preview, and version history.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-white">{detail.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {detail.category} / {(detail.currentExtension ?? "file").toUpperCase()}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <WsStatusPill className="border-sky-400/30 bg-sky-500/10 text-sky-100">
                      Rev {detail.currentRevision ?? "—"}
                    </WsStatusPill>
                    <WsStatusPill className="border-white/15 bg-white/5 text-slate-200">{detail.status}</WsStatusPill>
                    {detail.masterTitle ? (
                      <WsStatusPill className="border-teal-400/30 bg-teal-500/10 text-teal-100">
                        Master: {detail.masterTitle}
                      </WsStatusPill>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={WsSecondaryButtonClass()} onClick={() => setVersionOpen(true)}>
                    Upload New Version
                  </button>
                  <button type="button" className={WsSecondaryButtonClass()} onClick={() => setEditOpen(true)}>
                    Edit Metadata
                  </button>
                  <button type="button" className={WsSecondaryButtonClass()} disabled={busy} onClick={() => void handleArchive()}>
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                </div>
              </div>

              {detail.versions[0] ? (
                <TechnicalFilePreview
                  version={detail.versions.find((v) => v.isCurrent) ?? detail.versions[0]}
                  downloadUrl={previewUrl}
                  loading={detailLoading}
                />
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <InfoBlock title="File Information">
                  <InfoRow label="Filename" value={detail.currentFileName ?? "—"} />
                  <InfoRow label="Type" value={detail.fileKind} />
                  <InfoRow label="Size" value={formatTechnicalFileSize(detail.currentSizeBytes)} />
                  <InfoRow label="Revision" value={detail.currentRevision ?? "—"} />
                  <InfoRow label="Uploaded by" value={detail.uploadedByName || "—"} />
                  <InfoRow label="Created" value={formatDate(detail.createdAt)} />
                  <InfoRow label="Modified" value={formatDate(detail.updatedAt)} />
                </InfoBlock>
                <InfoBlock title="Relationships">
                  <InfoRow label="Master" value={detail.masterTitle ?? "—"} />
                  <InfoRow label="Program" value={detail.programRef ?? "—"} />
                  <InfoRow label="Product" value={detail.productRef ?? "—"} />
                  <InfoRow label="Part number" value={detail.partNumber ?? "—"} />
                  <InfoRow label="Drawing number" value={detail.drawingNumber ?? "—"} />
                  {relatedFiles.length ? (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Related files</div>
                      {relatedFiles.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className="block text-sm text-teal-300 hover:underline"
                          onClick={() => setSelectedId(f.id)}
                        >
                          {f.title}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </InfoBlock>
              </div>

              <InfoBlock title="Version History">
                <div className="space-y-2">
                  {detail.versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                    >
                      <div>
                        <div className="text-sm font-medium text-white">
                          Rev {version.revision} {version.isCurrent ? "· Current" : ""}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDate(version.createdAt)} · {version.uploadedByName}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!version.isCurrent ? (
                          <button
                            type="button"
                            className={WsSecondaryButtonClass()}
                            onClick={async () => {
                              await restoreTechnicalFileVersionApi(detail.id, version.id);
                              await loadDetail(detail.id);
                              setNotice(`Restored Rev ${version.revision} as current.`);
                            }}
                          >
                            Restore
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={WsSecondaryButtonClass()}
                          onClick={async () => {
                            const dl = await getTechnicalFileDownloadUrlApi(detail.id, version.id);
                            window.open(dl.url, "_blank");
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </InfoBlock>
            </div>
          )}
        </div>
      </div>

      {uploadOpen ? (
        <TechnicalFileDialog
          title="Upload Technical File"
          masters={masters}
          onClose={() => setUploadOpen(false)}
          onCreateMaster={async (title) => {
            const master = await createEngineeringMasterApi({ title });
            setMasters((prev) => [...prev, master]);
            return master.id;
          }}
          onSubmit={async (payload) => {
            setBusy(true);
            try {
              const prep = await prepareTechnicalFileUploadApi({
                fileName: payload.file.name,
                sizeBytes: payload.file.size,
              });
              await uploadTechnicalFileBlob(prep.signedUrl, payload.file);
              const file = await createTechnicalFileApi({
                fileName: payload.file.name,
                storagePath: prep.storagePath,
                versionId: prep.versionId,
                sizeBytes: payload.file.size,
                mimeType: payload.file.type,
                title: payload.title,
                description: payload.description,
                category: payload.category,
                status: payload.status,
                masterId: payload.masterId,
                programRef: payload.programRef,
                productRef: payload.productRef,
                partNumber: payload.partNumber,
                drawingNumber: payload.drawingNumber,
                revision: payload.revision,
                tags: payload.tags,
                notes: payload.notes,
              });
              setUploadOpen(false);
              setNotice(`Uploaded ${file.title}.`);
              await refreshList();
              setSelectedId(file.id);
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : null}

      {versionOpen && detail ? (
        <TechnicalFileDialog
          title="Upload New Version"
          masters={masters}
          initialRevision={nextRevision(detail.currentRevision)}
          onClose={() => setVersionOpen(false)}
          onCreateMaster={async () => ""}
          versionOnly
          onSubmit={async (payload) => {
            setBusy(true);
            try {
              const prep = await prepareTechnicalFileUploadApi({
                fileName: payload.file.name,
                sizeBytes: payload.file.size,
                technicalFileId: detail.id,
              });
              await uploadTechnicalFileBlob(prep.signedUrl, payload.file);
              const file = await addTechnicalFileVersionApi(detail.id, {
                fileName: payload.file.name,
                storagePath: prep.storagePath,
                versionId: prep.versionId,
                sizeBytes: payload.file.size,
                mimeType: payload.file.type,
                revision: payload.revision,
                changeNotes: payload.notes,
              });
              setVersionOpen(false);
              setNotice(`Uploaded Rev ${file.currentRevision}.`);
              await refreshList();
              await loadDetail(detail.id);
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : null}

      {editOpen && detail ? (
        <TechnicalFileDialog
          title="Edit Metadata"
          masters={masters}
          metadataOnly
          initial={{
            title: detail.title,
            description: detail.description,
            category: detail.category,
            status: detail.status,
            masterId: detail.masterId ?? "",
            programRef: detail.programRef ?? "",
            productRef: detail.productRef ?? "",
            partNumber: detail.partNumber ?? "",
            drawingNumber: detail.drawingNumber ?? "",
            tags: detail.tags.join(", "),
            notes: detail.notes,
          }}
          onClose={() => setEditOpen(false)}
          onCreateMaster={async (title) => {
            const master = await createEngineeringMasterApi({ title });
            setMasters((prev) => [...prev, master]);
            return master.id;
          }}
          onSubmit={async (payload) => {
            setBusy(true);
            try {
              await updateTechnicalFileApi(detail.id, {
                title: payload.title,
                description: payload.description,
                category: payload.category,
                status: payload.status,
                masterId: payload.masterId || null,
                programRef: payload.programRef,
                productRef: payload.productRef,
                partNumber: payload.partNumber,
                drawingNumber: payload.drawingNumber,
                tags: payload.tags,
                notes: payload.notes,
              });
              setEditOpen(false);
              setNotice("Metadata updated.");
              await refreshList();
              await loadDetail(detail.id);
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function nextRevision(current: string | null) {
  if (!current) return "A";
  const match = current.trim().toUpperCase().match(/^([A-Z]+)$/);
  if (!match) return `${current}-next`;
  const letters = match[1];
  const last = letters.charCodeAt(letters.length - 1);
  if (last < 90) return letters.slice(0, -1) + String.fromCharCode(last + 1);
  return `${letters}A`;
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 text-sm font-semibold text-white">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-200">{value}</span>
    </div>
  );
}

type DialogPayload = {
  file: File;
  title: string;
  description: string;
  category: string;
  status: string;
  masterId: string;
  programRef: string;
  productRef: string;
  partNumber: string;
  drawingNumber: string;
  revision: string;
  tags: string[];
  notes: string;
};

type DialogFormInitial = {
  title?: string;
  description?: string;
  category?: string;
  status?: string;
  masterId?: string;
  programRef?: string;
  productRef?: string;
  partNumber?: string;
  drawingNumber?: string;
  revision?: string;
  tags?: string;
  notes?: string;
};

function TechnicalFileDialog({
  title,
  masters,
  onClose,
  onSubmit,
  onCreateMaster,
  versionOnly,
  metadataOnly,
  initialRevision,
  initial,
}: {
  title: string;
  masters: EngineeringMaster[];
  onClose: () => void;
  onSubmit: (payload: DialogPayload) => Promise<void>;
  onCreateMaster: (title: string) => Promise<string>;
  versionOnly?: boolean;
  metadataOnly?: boolean;
  initialRevision?: string;
  initial?: DialogFormInitial;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "Other",
    status: initial?.status ?? "Draft",
    masterId: initial?.masterId ?? "",
    programRef: initial?.programRef ?? "",
    productRef: initial?.productRef ?? "",
    partNumber: initial?.partNumber ?? "",
    drawingNumber: initial?.drawingNumber ?? "",
    revision: initialRevision ?? initial?.revision ?? "A",
    tags: typeof initial?.tags === "string" ? initial.tags : "",
    notes: initial?.notes ?? "",
  });
  const [newMasterTitle, setNewMasterTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button type="button" className={WsSecondaryButtonClass()} onClick={onClose}>
            Close
          </button>
        </div>

        <div className="space-y-3">
          {!metadataOnly ? (
            <label className="block">
              <div className="mb-1 text-sm text-slate-400">File</div>
              <input
                type="file"
                className={WsInputClass()}
                onChange={(e) => {
                  const next = e.target.files?.[0] ?? null;
                  setFile(next);
                  if (next && !form.title) {
                    setForm((prev) => ({
                      ...prev,
                      title: next.name.replace(/\.[^.]+$/, ""),
                    }));
                  }
                }}
              />
            </label>
          ) : null}

          {!versionOnly ? (
            <>
              <Field label="Title" value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} />
              <Field
                label="Description"
                value={form.description}
                onChange={(v) => setForm((p) => ({ ...p, description: v }))}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <SelectField
                  label="Category"
                  value={form.category}
                  options={TECHNICAL_FILE_CATEGORIES}
                  onChange={(v) => setForm((p) => ({ ...p, category: v }))}
                />
                <SelectField
                  label="Status"
                  value={form.status}
                  options={TECHNICAL_FILE_STATUSES}
                  onChange={(v) => setForm((p) => ({ ...p, status: v }))}
                />
              </div>
            </>
          ) : null}

          {!metadataOnly ? (
            <Field label="Revision" value={form.revision} onChange={(v) => setForm((p) => ({ ...p, revision: v }))} />
          ) : null}

          {!versionOnly ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <div className="mb-1 text-sm text-slate-400">Master</div>
                  <select
                    className={WsInputClass()}
                    value={form.masterId}
                    onChange={(e) => setForm((p) => ({ ...p, masterId: e.target.value }))}
                  >
                    <option value="">None</option>
                    {masters.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <div className="mb-1 text-sm text-slate-400">New master</div>
                  <div className="flex gap-2">
                    <input
                      className={WsInputClass()}
                      value={newMasterTitle}
                      onChange={(e) => setNewMasterTitle(e.target.value)}
                      placeholder="Socket Liner Development"
                    />
                    <button
                      type="button"
                      className={WsSecondaryButtonClass()}
                      onClick={async () => {
                        if (!newMasterTitle.trim()) return;
                        const id = await onCreateMaster(newMasterTitle.trim());
                        setForm((p) => ({ ...p, masterId: id }));
                        setNewMasterTitle("");
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Program" value={form.programRef} onChange={(v) => setForm((p) => ({ ...p, programRef: v }))} />
                <Field label="Product" value={form.productRef} onChange={(v) => setForm((p) => ({ ...p, productRef: v }))} />
                <Field label="Part number" value={form.partNumber} onChange={(v) => setForm((p) => ({ ...p, partNumber: v }))} />
                <Field
                  label="Drawing number"
                  value={form.drawingNumber}
                  onChange={(v) => setForm((p) => ({ ...p, drawingNumber: v }))}
                />
              </div>
              <Field label="Tags (comma separated)" value={form.tags} onChange={(v) => setForm((p) => ({ ...p, tags: v }))} />
            </>
          ) : null}

          <Field label="Notes" value={form.notes} onChange={(v) => setForm((p) => ({ ...p, notes: v }))} />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={WsSecondaryButtonClass()} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={WsPrimaryButtonClass()}
            disabled={submitting || (!metadataOnly && !file)}
            onClick={async () => {
              if (!metadataOnly && !file) return;
              setSubmitting(true);
              try {
                await onSubmit({
                  file: file ?? new File([], "metadata-only"),
                  title: form.title,
                  description: form.description,
                  category: form.category,
                  status: form.status,
                  masterId: form.masterId,
                  programRef: form.programRef,
                  productRef: form.productRef,
                  partNumber: form.partNumber,
                  drawingNumber: form.drawingNumber,
                  revision: form.revision,
                  tags: form.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                  notes: form.notes,
                });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm text-slate-400">{label}</div>
      <input className={WsInputClass()} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm text-slate-400">{label}</div>
      <select className={WsInputClass()} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
