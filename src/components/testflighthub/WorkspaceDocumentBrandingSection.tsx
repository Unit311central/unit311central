"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";

import { cn } from "@/lib/utils";

type DocumentLogoState = {
  previewUrl: string | null;
  hasLogo: boolean;
  isDefault: boolean;
  filename: string | null;
};

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Request failed (${response.status})`);
  }
  return JSON.parse(text) as T;
}

export function WorkspaceDocumentBrandingSection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<DocumentLogoState>({
    previewUrl: null,
    hasLogo: false,
    isDefault: false,
    filename: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/workspace/document-logo", { cache: "no-store" });
      const body = await readApiJson<DocumentLogoState & { error?: string }>(response);
      if (!response.ok) throw new Error(body.error ?? "Unable to load workspace logo.");
      setState({
        previewUrl: body.previewUrl,
        hasLogo: body.hasLogo,
        isDefault: body.isDefault,
        filename: body.filename,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load workspace logo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function uploadFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/workspace/document-logo", { method: "POST", body: form });
      const body = await readApiJson<DocumentLogoState & { error?: string }>(response);
      if (!response.ok) throw new Error(body.error ?? "Upload failed.");
      setState({
        previewUrl: body.previewUrl,
        hasLogo: body.hasLogo,
        isDefault: body.isDefault,
        filename: body.filename,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function removeLogo() {
    if (!window.confirm("Remove the workspace document logo?")) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/workspace/document-logo", { method: "DELETE" });
      const body = await readApiJson<DocumentLogoState & { error?: string }>(response);
      if (!response.ok) throw new Error(body.error ?? "Remove failed.");
      setState({
        previewUrl: body.previewUrl,
        hasLogo: body.hasLogo,
        isDefault: body.isDefault,
        filename: body.filename,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed.");
    } finally {
      setBusy(false);
    }
  }

  const previewSrc = state.previewUrl
    ? state.previewUrl.startsWith("/api/")
      ? `${state.previewUrl}?t=${encodeURIComponent(state.filename ?? "logo")}`
      : state.previewUrl
    : null;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b1524]/50 px-4 py-4 sm:px-5">
      <h2 className="text-sm font-semibold tracking-[0.08em] text-white">WORKSPACE BRANDING</h2>
      <p className="mt-1 text-xs leading-relaxed text-white/50">
        Logo used across workspace documents and generated PDFs.
      </p>

      <div className="mt-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">Workspace Logo</p>
        <div className="mt-2 flex min-h-[88px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white/40" />
          ) : previewSrc && state.hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="Workspace document logo" className="max-h-16 w-auto max-w-full object-contain" />
          ) : (
            <div className="flex items-center gap-2 text-xs text-white/40">
              <ImageIcon className="h-4 w-4" />
              No logo configured
            </div>
          )}
        </div>
        {state.filename ? (
          <p className="mt-1 truncate text-[11px] text-white/40">{state.filename}</p>
        ) : state.isDefault ? (
          <p className="mt-1 text-[11px] text-white/40">Unit311 Central default document logo</p>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void uploadFile(file);
          }}
        />
        <button
          type="button"
          disabled={busy || loading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold",
            "border-sky-400/35 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25 disabled:opacity-60",
          )}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {state.hasLogo && !state.isDefault ? "REPLACE LOGO" : "UPLOAD LOGO"}
        </button>
        {state.hasLogo && !state.isDefault ? (
          <button
            type="button"
            disabled={busy || loading}
            onClick={() => void removeLogo()}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 text-xs font-semibold text-rose-200 hover:bg-rose-500/20 disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            REMOVE LOGO
          </button>
        ) : null}
      </div>
    </section>
  );
}
