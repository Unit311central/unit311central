"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

import {
  DEMO_PREVIEW_WORKSPACES,
  DEMO_WORKSPACE_SLUG,
  demoPreviewWorkspaceLabel,
  readBrowserDemoPreviewSlug,
  type DemoPreviewWorkspaceSlug,
} from "@/lib/demo/workspace-preview";
import { DEMO_ADMIN_USERNAME } from "@/lib/demo/read-only";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export default function DemoWorkspacePreviewSwitcher({ className }: Props) {
  const [username, setUsername] = useState<string | null>(null);
  const [slug, setSlug] = useState<DemoPreviewWorkspaceSlug>(DEMO_WORKSPACE_SLUG);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSlug(readBrowserDemoPreviewSlug());
    void fetch("/api/auth/whoami", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { username?: string | null } | null) => {
        setUsername(data?.username ?? null);
      })
      .catch(() => undefined);
  }, []);

  const isAdmin =
    String(username ?? "")
      .trim()
      .toLowerCase() === DEMO_ADMIN_USERNAME;

  if (!isAdmin) return null;

  async function handleChange(nextRaw: string) {
    const next = (nextRaw.trim().toLowerCase() || DEMO_WORKSPACE_SLUG) as DemoPreviewWorkspaceSlug;
    if (next === slug || saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/demo/preview-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: next }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to switch workspace preview.");
      }
      window.location.reload();
    } catch {
      setSaving(false);
    }
  }

  return (
    <label
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-xl border px-2 text-[11px] font-semibold text-white/80",
        className,
      )}
      style={{
        borderColor: "color-mix(in srgb, var(--platform-card-border, #243347) 85%, transparent)",
        background: "color-mix(in srgb, var(--platform-surface, #08111F) 70%, transparent)",
      }}
      title="Preview another workspace on Demo without signing in again"
    >
      <Building2 className="h-3.5 w-3.5 shrink-0 text-white/55" aria-hidden />
      <span className="hidden text-white/50 sm:inline">Workspace</span>
      <select
        aria-label="Preview workspace"
        className="max-w-[8.5rem] cursor-pointer appearance-none bg-transparent pr-1 text-[11px] font-semibold text-white outline-none disabled:opacity-50 sm:max-w-[9.5rem]"
        value={slug}
        disabled={saving}
        onChange={(event) => void handleChange(event.target.value)}
      >
        {DEMO_PREVIEW_WORKSPACES.map((workspace) => (
          <option key={workspace.slug} value={workspace.slug} className="bg-slate-900 text-white">
            {workspace.label}
          </option>
        ))}
      </select>
      {slug !== DEMO_WORKSPACE_SLUG ? (
        <span className="hidden rounded border border-sky-400/35 bg-sky-500/10 px-1 py-0.5 text-[9px] uppercase tracking-wide text-sky-200 lg:inline">
          Preview
        </span>
      ) : null}
      <span className="sr-only">
        Currently previewing {demoPreviewWorkspaceLabel(slug)} on the Demo host.
      </span>
    </label>
  );
}
