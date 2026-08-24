"use client";

import { useEffect, useState } from "react";
import { Download, FileWarning } from "lucide-react";

import {
  classifyTechnicalFile,
  isModelViewerFormat,
  isThreeJsModelFormat,
} from "@/lib/engineering-technical-files/file-types";
import type { TechnicalFileVersion } from "@/lib/engineering-technical-files/types";
import TechnicalFile3DViewer from "./TechnicalFile3DViewer";

type TechnicalFilePreviewProps = {
  version: TechnicalFileVersion;
  downloadUrl: string | null;
  loading?: boolean;
};

export default function TechnicalFilePreview({
  version,
  downloadUrl,
  loading,
}: TechnicalFilePreviewProps) {
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const ext = (version.extension ?? "").toLowerCase();
  const classified = classifyTechnicalFile(version.fileName, version.mimeType);

  useEffect(() => {
    setDocxHtml(null);
    setTextContent(null);
    setPreviewError(null);
    if (!downloadUrl) return;

    if (["txt", "csv"].includes(ext)) {
      fetch(downloadUrl)
        .then((r) => r.text())
        .then(setTextContent)
        .catch(() => setPreviewError("Could not load text preview."));
      return;
    }

    if (ext === "docx") {
      fetch(downloadUrl)
        .then((r) => r.arrayBuffer())
        .then(async (buffer) => {
          const mammoth = await import("mammoth");
          return mammoth.convertToHtml({ arrayBuffer: buffer });
        })
        .then((result) => setDocxHtml(result.value))
        .catch(() => setPreviewError("Could not render DOCX preview."));
    }
  }, [downloadUrl, ext]);

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-white/10 bg-slate-950/40 text-sm text-slate-400">
        Loading preview…
      </div>
    );
  }

  if (!downloadUrl) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-sm text-slate-400">
        <FileWarning className="h-8 w-8 text-slate-500" />
        Preview unavailable.
      </div>
    );
  }

  if (ext === "pdf") {
    return (
      <iframe
        title={version.fileName}
        src={downloadUrl}
        className="min-h-[70vh] w-full rounded-xl border border-white/10 bg-white"
      />
    );
  }

  if (["png", "jpg", "jpeg", "svg", "gif", "webp", "tif", "tiff"].includes(ext)) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-white/10 bg-slate-950/40 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={downloadUrl} alt={version.fileName} className="max-h-[70vh] max-w-full object-contain" />
      </div>
    );
  }

  if (isModelViewerFormat(ext) || isThreeJsModelFormat(ext)) {
    return <TechnicalFile3DViewer url={downloadUrl} extension={ext} fileName={version.fileName} />;
  }

  if (docxHtml) {
    return (
      <div
        className="prose prose-invert max-w-none min-h-[360px] overflow-auto rounded-xl border border-white/10 bg-slate-950/40 p-6"
        dangerouslySetInnerHTML={{ __html: docxHtml }}
      />
    );
  }

  if (textContent !== null) {
    return (
      <pre className="max-h-[70vh] overflow-auto rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200">
        {textContent}
      </pre>
    );
  }

  if (previewError) {
    return (
      <UnsupportedPreview
        fileName={version.fileName}
        extension={ext}
        kind={classified.kind}
        downloadUrl={downloadUrl}
        message={previewError}
      />
    );
  }

  if (classified.preview === "download_only" || ext === "doc" || ["ppt", "pptx", "xls", "xlsx"].includes(ext)) {
    return (
      <UnsupportedPreview
        fileName={version.fileName}
        extension={ext}
        kind={classified.kind}
        downloadUrl={downloadUrl}
      />
    );
  }

  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-white/10 bg-slate-950/30 text-sm text-slate-400">
      Preparing preview…
    </div>
  );
}

function UnsupportedPreview({
  fileName,
  extension,
  kind,
  downloadUrl,
  message,
}: {
  fileName: string;
  extension: string;
  kind: string;
  downloadUrl: string;
  message?: string;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-8 text-center">
      <div className="rounded-2xl border border-teal-400/20 bg-teal-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">
        {kind === "cad" ? "CAD" : kind === "model_3d" ? "3D Model" : extension.toUpperCase() || "FILE"}
      </div>
      <div>
        <p className="text-base font-medium text-white">{fileName}</p>
        <p className="mt-2 max-w-lg text-sm text-slate-400">
          {message ?? "Preview not currently available for this file type."}
        </p>
      </div>
      <a
        href={downloadUrl}
        download={fileName}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
      >
        <Download className="h-4 w-4" />
        Download File
      </a>
    </div>
  );
}
