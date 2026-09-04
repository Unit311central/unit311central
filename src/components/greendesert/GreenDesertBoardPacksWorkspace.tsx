"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Archive, Download, FileText, Sparkles, Trash2 } from "lucide-react";

import { DocumentPdfModal } from "@/components/workspace-ui/DocumentPdfModal";
import {
  archiveGreenDesertBoardPack,
  createGreenDesertBoardPackDraft,
  deleteGreenDesertBoardPack,
  loadGreenDesertBoardPacks,
  resolveGreenDesertPackDownloadUrl,
  resolveGreenDesertPackPdfUrl,
  saveGreenDesertBoardPack,
  type GreenDesertBoardPackRecord,
} from "@/lib/greendesert/greendesert-board-pack-store";
import { GREENDESERT_BOARD_DEFAULT_MEETING_DATE } from "@/lib/greendesert/greendesert-board-pack-model";
import { cn } from "@/lib/utils";
import {
  CorporateFieldLabel,
  corporateInputClass,
  corporatePrimaryButtonClass,
  corporateSecondaryButtonClass,
} from "@/components/testflighthub/corporate-ui";
import { GREENDESERT_DISPLAY_NAME } from "@/lib/greendesert-surface";

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
        {GREENDESERT_DISPLAY_NAME} · Board
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-white/55">{subtitle}</p>
    </header>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1524] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/60 hover:text-white"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function GreenDesertBoardPacksWorkspace() {
  const [decks, setDecks] = useState<GreenDesertBoardPackRecord[]>(() =>
    loadGreenDesertBoardPacks().filter((pack) => pack.status !== "Archived"),
  );
  const [previewPackId, setPreviewPackId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<GreenDesertBoardPackRecord | null>(null);

  const previewPack = useMemo(
    () => decks.find((pack) => pack.id === previewPackId) ?? null,
    [decks, previewPackId],
  );

  function refreshDecks() {
    const next = loadGreenDesertBoardPacks().filter((pack) => pack.status !== "Archived");
    setDecks(next);
    if (previewPackId && !next.some((pack) => pack.id === previewPackId)) {
      setPreviewPackId(null);
    }
  }

  function handleCreateDraft() {
    const draft = createGreenDesertBoardPackDraft({
      meetingDate: GREENDESERT_BOARD_DEFAULT_MEETING_DATE,
      quarter: "Q3 2026",
    });
    saveGreenDesertBoardPack(draft);
    refreshDecks();
    setPreviewPackId(draft.id);
    setMessage(`Created draft pack for ${draft.quarter}. Click Preview to open the PDF.`);
  }

  function saveEdit() {
    if (!editing?.packName.trim()) return;
    saveGreenDesertBoardPack(editing);
    refreshDecks();
    setEditing(null);
    setMessage("Board deck updated.");
  }

  const previewUrl = previewPack
    ? resolveGreenDesertPackPdfUrl(previewPack.meetingDate)
    : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Board Decks"
          subtitle="Green Desert board packs — preview, download, and approve for the board portal."
        />
        <button
          type="button"
          className={cn(corporatePrimaryButtonClass(), "shrink-0")}
          onClick={handleCreateDraft}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Create board pack
        </button>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}

      <div className="space-y-2">
        {decks.map((pack) => {
          const pdfUrl = resolveGreenDesertPackPdfUrl(pack.meetingDate);
          const downloadUrl = resolveGreenDesertPackDownloadUrl(pack.meetingDate);
          return (
            <article
              key={pack.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 sm:p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-white">{pack.packName}</h2>
                  <p className="mt-1 text-sm text-white/50">
                    {pack.quarter} · Meeting {formatDate(pack.meetingDate)}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 self-start rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase",
                    pack.status === "Approved" || pack.status === "Final"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                      : "border-amber-400/30 bg-amber-500/10 text-amber-100",
                  )}
                >
                  {pack.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={corporateSecondaryButtonClass()}
                  onClick={() => setPreviewPackId(pack.id)}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Preview
                </button>
                <a
                  href={downloadUrl}
                  download={`greendesert-board-deck-${pack.meetingDate}.pdf`}
                  className={corporateSecondaryButtonClass()}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
                <button
                  type="button"
                  className={corporateSecondaryButtonClass()}
                  onClick={() => setEditing({ ...pack })}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={corporateSecondaryButtonClass()}
                  onClick={() => {
                    archiveGreenDesertBoardPack(pack.id);
                    refreshDecks();
                    setMessage(`Archived ${pack.packName}.`);
                  }}
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </button>
                <button
                  type="button"
                  className={corporateSecondaryButtonClass()}
                  onClick={() => {
                    deleteGreenDesertBoardPack(pack.id);
                    refreshDecks();
                    setMessage(`Deleted ${pack.packName}.`);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {previewPack && previewUrl ? (
        <DocumentPdfModal
          title={previewPack.packName}
          pdfUrl={previewUrl}
          downloadFilename={`greendesert-board-deck-${previewPack.meetingDate}.pdf`}
          onClose={() => setPreviewPackId(null)}
        />
      ) : null}

      {editing ? (
        <Modal title="Edit board deck" onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <div>
              <CorporateFieldLabel>Pack name</CorporateFieldLabel>
              <input
                className={corporateInputClass()}
                value={editing.packName}
                onChange={(e) => setEditing({ ...editing, packName: e.target.value })}
              />
            </div>
            <div>
              <CorporateFieldLabel>Quarter</CorporateFieldLabel>
              <input
                className={corporateInputClass()}
                value={editing.quarter}
                onChange={(e) => setEditing({ ...editing, quarter: e.target.value })}
              />
            </div>
            <div>
              <CorporateFieldLabel>Meeting date</CorporateFieldLabel>
              <input
                type="date"
                className={corporateInputClass()}
                value={editing.meetingDate}
                onChange={(e) => setEditing({ ...editing, meetingDate: e.target.value })}
              />
            </div>
            <div>
              <CorporateFieldLabel>Status</CorporateFieldLabel>
              <select
                className={corporateInputClass()}
                value={editing.status}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    status: e.target.value as GreenDesertBoardPackRecord["status"],
                  })
                }
              >
                <option value="Draft">Draft</option>
                <option value="Final">Final</option>
                <option value="Approved">Approved</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className={corporateSecondaryButtonClass()} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className={corporatePrimaryButtonClass()} onClick={saveEdit}>
                Save
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
