"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Upload } from "lucide-react";

import InformationRepositoryAttachmentCarousel from "@/components/testflighthub/InformationRepositoryAttachmentCarousel";
import type { InformationRepositoryRecordAttachment } from "@/lib/unit311-details-data";
import { cn } from "@/lib/utils";

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

type InformationRepositoryAttachmentsPanelProps = {
  categoryId: string;
  apiBasePath: string;
};

export default function InformationRepositoryAttachmentsPanel({
  categoryId,
  apiBasePath,
}: InformationRepositoryAttachmentsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState<InformationRepositoryRecordAttachment[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<InformationRepositoryRecordAttachment | null>(null);
  const [editName, setEditName] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadAttachments = useCallback(async (selectLast = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${apiBasePath}/attachments?category=${encodeURIComponent(categoryId)}`,
        { cache: "no-store" },
      );
      const data = await readApiJson<{
        attachments?: InformationRepositoryRecordAttachment[];
        error?: string;
      }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to load attachments");
      const next = data.attachments ?? [];
      setAttachments(next);
      setActiveIndex((current) => {
        if (next.length === 0) return 0;
        if (selectLast) return next.length - 1;
        return Math.min(current, next.length - 1);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attachments");
    } finally {
      setLoading(false);
    }
  }, [apiBasePath, categoryId]);

  useEffect(() => {
    void loadAttachments();
  }, [loadAttachments]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const prepareResponse = await fetch(`${apiBasePath}/attachments/prepare`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: categoryId,
            name: file.name,
            size: file.size,
          }),
        });
        const prepareData = await readApiJson<{
          signedUrl?: string;
          storagePath?: string;
          error?: string;
        }>(prepareResponse);
        if (!prepareResponse.ok || !prepareData.signedUrl || !prepareData.storagePath) {
          throw new Error(prepareData.error ?? `Failed to prepare upload for ${file.name}`);
        }

        const uploadResponse = await fetch(prepareData.signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name} (${uploadResponse.status}).`);
        }

        const completeResponse = await fetch(`${apiBasePath}/attachments/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: categoryId,
            name: file.name,
            storagePath: prepareData.storagePath,
            mimeType: file.type || null,
            size: file.size,
          }),
        });
        const completeData = await readApiJson<{
          attachment?: InformationRepositoryRecordAttachment;
          error?: string;
        }>(completeResponse);
        if (!completeResponse.ok) {
          throw new Error(completeData.error ?? `Failed to finalize upload for ${file.name}`);
        }
      }
      await loadAttachments(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setUploading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBasePath}/attachments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: categoryId,
          fileId: editing.id,
          displayName: editName,
          caption: editCaption,
        }),
      });
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to update attachment");
      setEditing(null);
      await loadAttachments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update attachment");
    } finally {
      setUploading(false);
    }
  }

  async function deleteAttachment(attachment: InformationRepositoryRecordAttachment) {
    if (!window.confirm(`Delete "${attachment.name}"?`)) return;
    setUploading(true);
    setError(null);
    try {
      const response = await fetch(
        `${apiBasePath}/attachments?category=${encodeURIComponent(categoryId)}&fileId=${encodeURIComponent(attachment.id)}`,
        { method: "DELETE" },
      );
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to delete attachment");
      await loadAttachments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete attachment");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Record files</h3>
          <p className="mt-1 text-xs text-white/45">
            Add images, documents, videos, and other files to this record.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
            className="hidden"
            onChange={(event) => void uploadFiles(event.target.files)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-50",
            )}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Add files
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[18rem] items-center justify-center text-sm text-white/55">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading record files…
        </div>
      ) : attachments.length === 0 ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-[18rem] w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-[#0b1524]/40 px-6 text-center transition hover:border-emerald-400/30 hover:bg-emerald-500/[0.04] disabled:opacity-50"
        >
          <Plus className="h-8 w-8 text-emerald-300/80" />
          <p className="mt-4 text-sm font-medium text-white">Upload your first file</p>
          <p className="mt-1 max-w-md text-xs text-white/45">
            Images, PDFs, Office documents, videos, and archives are supported.
          </p>
        </button>
      ) : (
        <InformationRepositoryAttachmentCarousel
          attachments={attachments}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          onEdit={(attachment) => {
            setEditing(attachment);
            setEditName(attachment.name);
            setEditCaption(attachment.caption);
          }}
          onDelete={(attachment) => void deleteAttachment(attachment)}
          busy={uploading}
        />
      )}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <h4 className="text-lg font-semibold text-white">Edit file</h4>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                  Display name
                </label>
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                  Caption / notes
                </label>
                <textarea
                  value={editCaption}
                  onChange={(event) => setEditCaption(event.target.value)}
                  className="mt-1.5 min-h-24 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/75"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploading || !editName.trim()}
                className="rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-100 disabled:opacity-50"
                onClick={() => void saveEdit()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
