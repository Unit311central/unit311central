"use client";

import Image from "next/image";
import Link from "next/link";
import { Manrope } from "next/font/google";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  LogOut,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import AbhiLogoMark from "@/components/layout/AbhiLogoMark";
import {
  type AbhiPortalsEditableContent,
  type PortalsModuleRow,
  defaultAbhiPortalsContent,
  newPortalsRowId,
} from "@/lib/abhi/portals-demo";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const UNIT311_LOGO = "/images/unit311central-login.webp";

type CredentialBlock = {
  title: string;
  url: string;
  urlLabel: string;
  username: string;
  password: string;
};

const PLATFORM_LOGINS: CredentialBlock[] = [
  {
    title: "ABHI Platform Login",
    url: "https://abhi.unit311central.com/login",
    urlLabel: "abhi.unit311central.com/login",
    username: "demo@abhi.org.uk",
    password: "London1999$",
  },
  {
    title: "Board Portal Login",
    url: "https://abhi.unit311central.com/board",
    urlLabel: "abhi.unit311central.com/board",
    username: "board@abhi.org.uk",
    password: "London1999$",
  },
  {
    title: "Member Portal Access — Demo Centrak",
    url: "https://abhi.unit311central.com/centrak",
    urlLabel: "abhi.unit311central.com/centrak",
    username: "demo@centrak.com",
    password: "London1999$",
  },
];

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore clipboard failures.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-white/55 transition hover:border-white/30 hover:text-white"
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CredentialCard({ block }: { block: CredentialBlock }) {
  return (
    <article className="rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.09] to-white/[0.02] p-4">
      <h3 className="text-[15px] font-semibold tracking-tight text-white">{block.title}</h3>
      <a
        href={block.url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-sky-300/90 transition hover:text-sky-200"
      >
        {block.urlLabel}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
      <dl className="mt-3 space-y-2 text-[12px]">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
          <div className="min-w-0">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-white/40">Username</dt>
            <dd className="truncate font-medium text-white/90">{block.username}</dd>
          </div>
          <CopyButton value={block.username} label="username" />
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
          <div className="min-w-0">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-white/40">Password</dt>
            <dd className="truncate font-medium text-white/90">{block.password}</dd>
          </div>
          <CopyButton value={block.password} label="password" />
        </div>
      </dl>
    </article>
  );
}

function EditableRows({
  rows,
  canEdit,
  accent,
  onChange,
}: {
  rows: PortalsModuleRow[];
  canEdit: boolean;
  accent: "sky" | "pink";
  onChange: (next: PortalsModuleRow[]) => void;
}) {
  function updateRow(id: string, patch: Partial<PortalsModuleRow>) {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function removeRow(id: string) {
    onChange(rows.filter((row) => row.id !== id));
  }

  function addTopLevelRow() {
    onChange([...rows, { id: newPortalsRowId("r"), text: "", indent: 0 }]);
  }

  /** Insert a nested row after this top-level row (and its existing children). */
  function addNestedUnder(parentId: string) {
    const parentIndex = rows.findIndex((row) => row.id === parentId);
    if (parentIndex < 0) return;

    let insertAt = parentIndex + 1;
    while (insertAt < rows.length && rows[insertAt]?.indent === 1) {
      insertAt += 1;
    }

    const next = [...rows];
    next.splice(insertAt, 0, {
      id: newPortalsRowId("n"),
      text: "",
      indent: 1,
    });
    onChange(next);
  }

  function addNestedAtEnd() {
    const lastTopLevel = [...rows].reverse().find((row) => row.indent !== 1);
    if (lastTopLevel) {
      addNestedUnder(lastTopLevel.id);
      return;
    }
    onChange([
      ...rows,
      { id: newPortalsRowId("r"), text: "", indent: 0 },
      { id: newPortalsRowId("n"), text: "", indent: 1 },
    ]);
  }

  function moveRow(index: number, direction: -1 | 1) {
    const row = rows[index];
    if (!row) return;

    // Nested: swap with adjacent nested sibling when possible.
    if (row.indent === 1) {
      const target = index + direction;
      if (target < 0 || target >= rows.length) return;
      if (rows[target]?.indent !== 1 && direction === -1) return;
      if (rows[target]?.indent !== 1 && direction === 1) return;
      const next = [...rows];
      const current = next[index]!;
      next[index] = next[target]!;
      next[target] = current;
      onChange(next);
      return;
    }

    // Top-level: move the row together with its nested children.
    let end = index + 1;
    while (end < rows.length && rows[end]?.indent === 1) end += 1;
    const block = rows.slice(index, end);

    if (direction === -1) {
      if (index === 0) return;
      let prevStart = index - 1;
      while (prevStart > 0 && rows[prevStart]?.indent === 1) prevStart -= 1;
      onChange([
        ...rows.slice(0, prevStart),
        ...block,
        ...rows.slice(prevStart, index),
        ...rows.slice(end),
      ]);
      return;
    }

    if (end >= rows.length) return;
    let nextEnd = end + 1;
    while (nextEnd < rows.length && rows[nextEnd]?.indent === 1) nextEnd += 1;
    onChange([
      ...rows.slice(0, index),
      ...rows.slice(end, nextEnd),
      ...block,
      ...rows.slice(nextEnd),
    ]);
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="flex-1 space-y-2.5">
        {rows.map((row, index) => (
          <li
            key={row.id}
            className={cn(
              "flex items-start gap-2",
              row.indent === 1 && "ml-3 border-l border-white/10 pl-3",
            )}
          >
            {accent === "pink" && row.indent !== 1 ? (
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F48FB1]" />
            ) : null}
            {canEdit ? (
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start gap-1.5">
                  <div className="flex shrink-0 flex-col gap-0.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => moveRow(index, -1)}
                      disabled={index === 0}
                      className="rounded border border-white/15 p-0.5 text-white/55 hover:bg-white/5 hover:text-white disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRow(index, 1)}
                      disabled={index >= rows.length - 1}
                      className="rounded border border-white/15 p-0.5 text-white/55 hover:bg-white/5 hover:text-white disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    value={row.text}
                    onChange={(event) => updateRow(row.id, { text: event.target.value })}
                    placeholder={row.indent === 1 ? "Nested row…" : "Top-level row…"}
                    className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-sky-400/50"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 pl-8">
                  <label className="inline-flex items-center gap-1.5 text-[10px] text-white/45">
                    <input
                      type="checkbox"
                      checked={row.indent === 1}
                      onChange={(event) =>
                        updateRow(row.id, { indent: event.target.checked ? 1 : 0 })
                      }
                      className="h-3 w-3 rounded border-white/20"
                    />
                    Nested
                  </label>
                  {row.indent !== 1 ? (
                    <button
                      type="button"
                      onClick={() => addNestedUnder(row.id)}
                      className="inline-flex items-center gap-1 rounded border border-sky-400/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-100 hover:bg-sky-500/20"
                    >
                      <Plus className="h-3 w-3" />
                      Add nested
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="inline-flex items-center gap-1 rounded border border-rose-400/25 px-1.5 py-0.5 text-[10px] text-rose-200 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <p
                className={cn(
                  "min-w-0 flex-1 leading-snug",
                  row.indent === 1
                    ? "text-[12px] text-white/55"
                    : "text-[13px] font-medium text-white/90",
                )}
              >
                {row.text}
              </p>
            )}
          </li>
        ))}
      </ul>
      {canEdit ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={addTopLevelRow}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/35 bg-sky-500/15 px-3 py-2 text-[11px] font-semibold text-sky-50 hover:bg-sky-500/25"
          >
            <Plus className="h-3.5 w-3.5" />
            Add top-level row
          </button>
          <button
            type="button"
            onClick={addNestedAtEnd}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/[0.06] px-3 py-2 text-[11px] font-semibold text-white/85 hover:bg-white/[0.1]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add nested row
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function AbhiPortalsDemoPage() {
  const [content, setContent] = useState<AbhiPortalsEditableContent>(() =>
    defaultAbhiPortalsContent(),
  );
  const [canEdit, setCanEdit] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const dirtyRef = useRef(false);
  const contentRef = useRef(content);
  contentRef.current = content;

  const applyContent = useCallback((next: AbhiPortalsEditableContent, markDirty: boolean) => {
    if (markDirty) dirtyRef.current = true;
    setContent(next);
  }, []);

  const loadContent = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading(true);
      setLoadError(null);
    }
    try {
      const response = await fetch("/api/abhi/portals-content", { cache: "no-store" });
      if (response.status === 401) {
        window.location.assign("/login?next=%2Fportals");
        return;
      }
      const data = (await response.json()) as {
        content?: AbhiPortalsEditableContent;
        canEdit?: boolean;
        username?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Failed to load portals content");
      if (data.content && !dirtyRef.current) {
        setContent(data.content);
      }
      setCanEdit(Boolean(data.canEdit));
      setUsername(data.username ?? null);
    } catch (error) {
      if (!silent) {
        setLoadError(error instanceof Error ? error.message : "Failed to load");
      }
    } finally {
      if (!silent) setLoading(false);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  // Viewers (and idle admin): refresh every few seconds so edits appear without a manual reload.
  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(() => {
      if (dirtyRef.current || saving) return;
      void loadContent({ silent: true });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [ready, saving, loadContent]);

  const saveContent = useCallback(async (payload?: AbhiPortalsEditableContent) => {
    if (!canEdit) return;
    const body = payload ?? contentRef.current;
    setSaving(true);
    setSaveMessage("Saving…");
    try {
      const response = await fetch("/api/abhi/portals-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: body }),
      });
      const data = (await response.json()) as {
        content?: AbhiPortalsEditableContent;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Save failed");
      dirtyRef.current = false;
      if (data.content) setContent(data.content);
      setSaveMessage("Saved");
      window.setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [canEdit]);

  // Auto-save shortly after admin edits.
  useEffect(() => {
    if (!canEdit || !ready || !dirtyRef.current) return;
    const timer = window.setTimeout(() => {
      void saveContent(content);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [content, canEdit, ready, saveContent]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue to login regardless.
    }
    window.location.assign("/login?next=%2Fportals");
  }

  return (
    <div className={cn(body.className, "min-h-[100dvh] bg-[#07111f] text-white")}>
      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <header className="relative flex items-center justify-between gap-4">
          <Link href="https://unit311central.com" className="shrink-0" aria-label={SITE_NAME}>
            <div className="relative h-9 w-[160px] sm:h-10 sm:w-[190px]">
              <Image
                src={UNIT311_LOGO}
                alt={SITE_NAME}
                fill
                priority
                sizes="190px"
                className="object-contain object-left drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
              />
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {username ? (
              <p className="hidden text-[11px] text-white/50 sm:block">{username}</p>
            ) : null}
            {canEdit ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-100">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {saveMessage ?? "Auto-save on"}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] text-white/70 hover:bg-white/[0.04] hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
            <AbhiLogoMark height={36} tone="onDark" priority />
          </div>
        </header>

        <section className="relative mt-8 max-w-3xl sm:mt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F48FB1]">
            Pre-demo briefing
          </p>
          <h1 className="mt-2 text-[2rem] font-semibold leading-[1.1] tracking-tight text-white sm:text-[2.5rem]">
            ABHI on Unit311 Central
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/65 sm:text-[15px]">
            Credential and capability overview for your demonstration. Sign in with{" "}
            <span className="text-white/90">demo@abhi.org.uk</span> to view, or{" "}
            <span className="text-white/90">admin@abhi.org.uk</span> to edit columns 2 and 3.
          </p>
          {canEdit ? (
            <p className="mt-2 text-[12px] text-emerald-200/80">
              Admin edit mode — edits auto-save; other open views refresh within a few seconds.
              {saveMessage ? ` ${saveMessage}` : ""}
            </p>
          ) : null}
          {loadError ? (
            <p className="mt-2 text-[12px] text-rose-200">{loadError}</p>
          ) : null}
        </section>

        {loading ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading briefing…
          </div>
        ) : (
          <div className="relative mt-8 grid flex-1 items-stretch gap-5 lg:mt-10 lg:grid-cols-3 lg:gap-6">
            <section className="flex h-full min-h-0 flex-col">
              <div className="border-b border-white/10 pb-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/80">
                  Column 1
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
                  Platform Login
                </h2>
              </div>
              <div className="mt-3 flex h-full flex-col gap-3 rounded-2xl border border-white/12 bg-white/[0.04] p-4 backdrop-blur-md">
                {PLATFORM_LOGINS.map((block) => (
                  <CredentialCard key={block.title} block={block} />
                ))}
              </div>
            </section>

            <section className="flex h-full min-h-0 flex-col">
              <div className="border-b border-white/10 pb-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/80">
                  Column 2
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
                  Major Modules
                </h2>
              </div>
              <div className="mt-3 flex h-full flex-col rounded-2xl border border-white/12 bg-white/[0.04] p-4 backdrop-blur-md">
                <EditableRows
                  rows={content.majorModules}
                  canEdit={canEdit}
                  accent="sky"
                  onChange={(majorModules) =>
                    applyContent({ ...contentRef.current, majorModules }, true)
                  }
                />
              </div>
            </section>

            <section className="flex h-full min-h-0 flex-col">
              <div className="border-b border-white/10 pb-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F48FB1]/90">
                  Column 3
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
                  ABHI Customised Modules
                </h2>
              </div>
              <div className="mt-3 flex h-full flex-col rounded-2xl border border-[#C2185B]/25 bg-gradient-to-b from-[#C2185B]/12 to-white/[0.03] p-4 backdrop-blur-md">
                <EditableRows
                  rows={content.customModules}
                  canEdit={canEdit}
                  accent="pink"
                  onChange={(customModules) =>
                    applyContent({ ...contentRef.current, customModules }, true)
                  }
                />
              </div>
            </section>
          </div>
        )}

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[11px] text-white/40">
          <p>
            {SITE_NAME} · Confidential demonstration material for ABHI
          </p>
          <Link
            href="/login?next=%2Fportals"
            className="inline-flex items-center gap-1 font-medium text-sky-300/80 transition hover:text-sky-200"
          >
            Switch account
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </div>
    </div>
  );
}
