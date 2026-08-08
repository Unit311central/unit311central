"use client";

import Image from "next/image";
import Link from "next/link";
import { Manrope } from "next/font/google";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AbhiLogoMark from "@/components/layout/AbhiLogoMark";
import {
  type AbhiPortalsEditableContent,
  type PortalsIndent,
  type PortalsModuleRow,
  defaultAbhiPortalsContent,
  newPortalsRowId,
  portalsRowBlockEnd,
  portalsRowIndent,
} from "@/lib/abhi/portals-demo";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const UNIT311_LOGO = "/images/unit311central-login.webp";
const PORTALS_ADMIN_LOCK_KEY = "abhi_portals_admin_lock";

function readPortalsAdminLock(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(PORTALS_ADMIN_LOCK_KEY) === "1";
  } catch {
    return false;
  }
}

function writePortalsAdminLock(locked: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (locked) window.sessionStorage.setItem(PORTALS_ADMIN_LOCK_KEY, "1");
    else window.sessionStorage.removeItem(PORTALS_ADMIN_LOCK_KEY);
  } catch {
    // Ignore quota / private mode failures.
  }
}

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
  {
    title: "Member Portal Access — Abbott Diagnostics",
    url: "https://abhi.unit311central.com/abbotdiagnostics",
    urlLabel: "abhi.unit311central.com/abbotdiagnostics",
    username: "demo@abbotdiagnostics.com",
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

type ModuleNode = {
  row: PortalsModuleRow;
  index: number;
  children: ModuleNode[];
};

function buildModuleTree(rows: PortalsModuleRow[]): ModuleNode[] {
  const roots: ModuleNode[] = [];
  let current0: ModuleNode | null = null;
  let current1: ModuleNode | null = null;
  let current2: ModuleNode | null = null;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    const indent = portalsRowIndent(row);
    const node: ModuleNode = { row, index, children: [] };

    if (indent === 0) {
      roots.push(node);
      current0 = node;
      current1 = null;
      current2 = null;
      continue;
    }
    if (indent === 1) {
      if (current0) {
        current0.children.push(node);
        current1 = node;
        current2 = null;
      } else {
        roots.push(node);
        current0 = node;
        current1 = null;
        current2 = null;
      }
      continue;
    }
    if (indent === 2) {
      if (current1) {
        current1.children.push(node);
        current2 = node;
      } else if (current0) {
        current0.children.push(node);
        current2 = node;
      } else {
        roots.push(node);
        current0 = node;
        current2 = null;
      }
      continue;
    }
    if (current2) {
      current2.children.push(node);
    } else if (current1) {
      current1.children.push(node);
    } else if (current0) {
      current0.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function EditableRows({
  rows,
  canEdit,
  accent,
  collapsible = false,
  onChange,
}: {
  rows: PortalsModuleRow[];
  canEdit: boolean;
  accent: "sky" | "pink";
  /** When true, top-level rows collapse nested children behind an expand arrow. */
  collapsible?: boolean;
  onChange: (next: PortalsModuleRow[]) => void;
}) {
  const tree = useMemo(() => buildModuleTree(rows), [rows]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [focusRowId, setFocusRowId] = useState<string | null>(null);

  function isExpanded(id: string) {
    if (!collapsible) return true;
    return Boolean(expandedIds[id]);
  }

  function toggleExpanded(id: string) {
    setExpandedIds((current) => ({
      ...current,
      [id]: !Boolean(current[id]),
    }));
  }

  function renderExpandControl(
    id: string,
    open: boolean,
    hasChildren: boolean,
    depth: number,
  ) {
    if (!collapsible || !hasChildren || depth >= 2) {
      return <span className="mt-0.5 inline-flex h-6 w-6 shrink-0" aria-hidden />;
    }
    const ExpandIcon = open ? ChevronDown : ChevronRight;
    return (
      <button
        type="button"
        onClick={() => toggleExpanded(id)}
        className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 text-white/70 hover:bg-white/5 hover:text-white"
        aria-expanded={open}
        aria-label={open ? "Collapse" : "Expand"}
      >
        <ExpandIcon className="h-3.5 w-3.5" />
      </button>
    );
  }

  function updateRow(id: string, patch: Partial<PortalsModuleRow>) {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function removeRow(id: string) {
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) return;
    const end = portalsRowBlockEnd(rows, index);
    onChange([...rows.slice(0, index), ...rows.slice(end)]);
  }

  function addTopLevelRow() {
    const id = newPortalsRowId("r");
    onChange([...rows, { id, text: "", indent: 0 }]);
    setExpandedIds((current) => ({ ...current, [id]: true }));
    setFocusRowId(id);
  }

  function addChildUnder(parentId: string) {
    const parentIndex = rows.findIndex((row) => row.id === parentId);
    if (parentIndex < 0) return;
    const parentIndent = portalsRowIndent(rows[parentIndex]);
    if (parentIndent >= 2) return;
    const childIndent = (parentIndent + 1) as PortalsIndent;
    const insertAt = portalsRowBlockEnd(rows, parentIndex);
    const id = newPortalsRowId(childIndent === 2 ? "nn" : "n");
    const next = [...rows];
    next.splice(insertAt, 0, {
      id,
      text: "",
      indent: childIndent,
    });
    onChange(next);
    setExpandedIds((current) => ({ ...current, [parentId]: true }));
    setFocusRowId(id);
  }

  function moveRow(index: number, direction: -1 | 1) {
    const row = rows[index];
    if (!row) return;
    const indent = portalsRowIndent(row);
    const end = portalsRowBlockEnd(rows, index);
    const block = rows.slice(index, end);

    if (direction === -1) {
      let prev = index - 1;
      while (prev >= 0 && portalsRowIndent(rows[prev]) > indent) prev -= 1;
      if (prev < 0 || portalsRowIndent(rows[prev]) !== indent) return;
      onChange([
        ...rows.slice(0, prev),
        ...block,
        ...rows.slice(prev, index),
        ...rows.slice(end),
      ]);
      return;
    }

    if (end >= rows.length || portalsRowIndent(rows[end]) !== indent) return;
    const nextEnd = portalsRowBlockEnd(rows, end);
    onChange([
      ...rows.slice(0, index),
      ...rows.slice(end, nextEnd),
      ...block,
      ...rows.slice(nextEnd),
    ]);
  }

  function canMove(index: number, direction: -1 | 1) {
    const indent = portalsRowIndent(rows[index]);
    const end = portalsRowBlockEnd(rows, index);
    if (direction === -1) {
      let prev = index - 1;
      while (prev >= 0 && portalsRowIndent(rows[prev]) > indent) prev -= 1;
      return prev >= 0 && portalsRowIndent(rows[prev]) === indent;
    }
    return end < rows.length && portalsRowIndent(rows[end]) === indent;
  }

  function renderNode(node: ModuleNode, depth: 0 | 1 | 2) {
    const hasChildren = node.children.length > 0;
    const open = isExpanded(node.row.id);
    const childLabel = depth === 0 ? "sub-row" : "sub-sub-row";
    const placeholder =
      depth === 0 ? "Top-level row…" : depth === 1 ? "Sub-row…" : "Sub-sub-row…";

    // Viewers skip blank drafts; admins always see the input so new rows stay editable.
    if (!canEdit && !node.row.text.trim() && !hasChildren) return null;

    return (
      <li key={node.row.id} className="space-y-1">
        <div className="flex items-start gap-1.5">
          {renderExpandControl(node.row.id, open, hasChildren, depth)}
          {!collapsible && depth === 0 && accent === "pink" ? (
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F48FB1]" />
          ) : null}

          {canEdit ? (
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-start gap-1.5">
                <div className="flex shrink-0 flex-col gap-0.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => moveRow(node.index, -1)}
                    disabled={!canMove(node.index, -1)}
                    className="rounded border border-white/15 p-0.5 text-white/55 hover:bg-white/5 hover:text-white disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRow(node.index, 1)}
                    disabled={!canMove(node.index, 1)}
                    className="rounded border border-white/15 p-0.5 text-white/55 hover:bg-white/5 hover:text-white disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  value={node.row.text}
                  onChange={(event) => updateRow(node.row.id, { text: event.target.value })}
                  placeholder={placeholder}
                  autoFocus={focusRowId === node.row.id}
                  onFocus={() => {
                    if (focusRowId === node.row.id) setFocusRowId(null);
                  }}
                  className={cn(
                    "min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-white outline-none placeholder:text-white/30 focus:border-sky-400/50",
                    depth === 0 ? "text-[13px] font-medium" : "text-[12px]",
                    depth === 2 && "text-white/85",
                  )}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-8">
                {depth < 2 ? (
                  <button
                    type="button"
                    onClick={() => addChildUnder(node.row.id)}
                    className="inline-flex items-center gap-1 rounded border border-sky-400/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-100 hover:bg-sky-500/20"
                  >
                    <Plus className="h-3 w-3" />
                    Add {childLabel}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeRow(node.row.id)}
                  className="inline-flex items-center gap-1 rounded border border-rose-400/25 px-1.5 py-0.5 text-[10px] text-rose-200 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
                {depth === 0 && hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(node.row.id)}
                    className="text-[10px] text-white/45 hover:text-white/70"
                  >
                    {open ? "Hide sub-rows" : `Show ${node.children.length} sub-rows`}
                  </button>
                ) : null}
              </div>
            </div>
          ) : hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpanded(node.row.id)}
              className={cn(
                "min-w-0 flex-1 rounded-lg px-1 py-1 text-left hover:bg-white/[0.04]",
                depth === 0
                  ? "text-[13px] font-medium text-white/90"
                  : "text-[12px] text-white/55",
              )}
            >
              {node.row.text}
              {!open ? (
                <span className="ml-2 text-[11px] font-normal text-white/40">
                  ({node.children.length})
                </span>
              ) : null}
            </button>
          ) : (
            <p
              className={cn(
                "min-w-0 flex-1 rounded-lg px-1 py-1 leading-snug",
                depth === 0
                  ? "text-[13px] font-medium text-white/90"
                  : depth === 1
                    ? "text-[12px] text-white/55"
                    : "text-[11px] text-white/45",
              )}
            >
              {node.row.text}
            </p>
          )}
        </div>

        {open && hasChildren ? (
          <ul
            className={cn(
              "space-y-1.5 border-l border-white/10 pl-3",
              depth === 0 ? "ml-7" : depth === 1 ? "ml-6" : "ml-5",
            )}
          >
            {node.children.map((child) =>
              renderNode(child, depth === 0 ? 1 : 2),
            )}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="flex-1 space-y-1.5">{tree.map((node) => renderNode(node, 0))}</ul>
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const dirtyRef = useRef(false);
  /** Once admin edit is granted in this tab, never demote until Sign out. */
  const adminLockRef = useRef(false);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    if (!readPortalsAdminLock()) return;
    adminLockRef.current = true;
    setCanEdit(true);
  }, []);

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
      const response = await fetch("/api/abhi/portals-content", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (response.status === 401) {
        // Initial auth failure → login. Silent polls / locked admin editors must
        // not bounce mid-edit on a transient cookie glitch.
        if (!silent && !adminLockRef.current) {
          window.location.assign("/login?next=%2Fportals");
        }
        return;
      }
      const data = (await response.json()) as {
        content?: AbhiPortalsEditableContent;
        canEdit?: boolean;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Failed to load portals content");
      if (data.content && !dirtyRef.current) {
        setContent(data.content);
      }
      const nextCanEdit = Boolean(data.canEdit) || adminLockRef.current;
      if (nextCanEdit) {
        adminLockRef.current = true;
        writePortalsAdminLock(true);
      }
      setCanEdit(nextCanEdit);
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

  // View-only sessions refresh so admin edits appear. Admin editors do not poll —
  // polls were racing autosave and flipping the UI back to the demo view.
  useEffect(() => {
    if (!ready || canEdit || adminLockRef.current) return;
    const timer = window.setInterval(() => {
      if (dirtyRef.current || saving || adminLockRef.current) return;
      void loadContent({ silent: true });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [ready, canEdit, saving, loadContent]);

  const saveContent = useCallback(async (payload?: AbhiPortalsEditableContent) => {
    if (!canEdit && !adminLockRef.current) return;
    const body = payload ?? contentRef.current;
    // Clear dirty before the request so typing during save re-marks dirty and
    // we do not clobber in-progress draft rows with the server echo.
    dirtyRef.current = false;
    setSaving(true);
    setSaveMessage("Saving…");
    try {
      const response = await fetch("/api/abhi/portals-content", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ content: body }),
      });
      const data = (await response.json()) as {
        content?: AbhiPortalsEditableContent;
        error?: string;
      };
      // Keep edit mode on save failures — demoting on 401/403 was the "flick to
      // demo view" bug when a transient session read raced autosave.
      if (!response.ok) {
        dirtyRef.current = true;
        throw new Error(data.error ?? "Save failed");
      }
      // Prefer local editor state when the user kept typing during save.
      if (data.content && !dirtyRef.current) {
        setContent(data.content);
      }
      setSaveMessage("Saved");
      window.setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [canEdit]);

  // Auto-save shortly after admin edits. Skip while a draft row is still blank so
  // a brand-new sub-row is not raced by save before the admin can type.
  useEffect(() => {
    if (!canEdit || !ready || !dirtyRef.current) return;
    const hasBlankDraft =
      content.majorModules.some((row) => !row.text.trim()) ||
      content.customModules.some((row) => !row.text.trim());
    if (hasBlankDraft) return;
    const timer = window.setTimeout(() => {
      void saveContent(content);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [content, canEdit, ready, saveContent]);

  async function handleLogout() {
    adminLockRef.current = false;
    writePortalsAdminLock(false);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {
      // Continue to login regardless.
    }
    window.location.assign("/login?next=%2Fportals");
  }

  return (
    <div className={cn(body.className, "min-h-[100dvh] bg-[#07111f] text-white")}>
      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <header className="relative flex items-center justify-between gap-4">
          <Link
            href="https://abhi.unit311central.com"
            className="shrink-0"
            aria-label="ABHI"
          >
            <AbhiLogoMark height={36} tone="onDark" priority />
          </Link>
          <div className="flex items-center gap-3">
            {canEdit ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-100">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {saveMessage ?? "Auto-save on"}
                </span>
                <button
                  type="button"
                  onClick={() => void saveContent()}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/40 bg-sky-500/20 px-3 py-1.5 text-[11px] font-semibold text-sky-50 hover:bg-sky-500/30 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save
                </button>
              </>
            ) : null}
            <Link href="https://unit311central.com" className="shrink-0" aria-label={SITE_NAME}>
              <div className="relative h-9 w-[160px] sm:h-10 sm:w-[190px]">
                <Image
                  src={UNIT311_LOGO}
                  alt={SITE_NAME}
                  fill
                  priority
                  sizes="190px"
                  className="object-contain object-right drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                />
              </div>
            </Link>
          </div>
        </header>

        <section className="relative mt-8 max-w-3xl sm:mt-10">
          <h1 className="text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-white whitespace-nowrap sm:text-[2.25rem]">
            ABHI Overview Portal
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/65 sm:text-[15px]">
            An overview portal page for Peter Ellingworth for Unit311 Central customised ABHI
            Platform.
          </p>
          {canEdit ? (
            <p className="mt-2 text-[12px] text-emerald-200/80">
              Admin edit mode — use Save or wait for auto-save. Nested rows support sub-rows and
              sub-sub-rows.
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
                <h2 className="text-lg font-semibold tracking-tight text-white">
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
                <h2 className="text-lg font-semibold tracking-tight text-white">
                  Major Modules
                </h2>
              </div>
              <div className="mt-3 flex h-full flex-col rounded-2xl border border-white/12 bg-white/[0.04] p-4 backdrop-blur-md">
                <EditableRows
                  rows={content.majorModules}
                  canEdit={canEdit}
                  accent="sky"
                  collapsible
                  onChange={(majorModules) =>
                    applyContent({ ...contentRef.current, majorModules }, true)
                  }
                />
              </div>
            </section>

            <section className="flex h-full min-h-0 flex-col">
              <div className="border-b border-white/10 pb-3">
                <h2 className="text-lg font-semibold tracking-tight text-white">
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
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-1 font-medium text-sky-300/80 transition hover:text-sky-200"
          >
            Switch account
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </footer>
      </div>
    </div>
  );
}
