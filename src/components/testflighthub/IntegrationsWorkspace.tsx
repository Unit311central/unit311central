"use client";

import { useCallback, useEffect, useState, startTransition } from "react";
import { Loader2, Plug, X } from "lucide-react";

import {
  groupIntegrationsByCategory,
  integrationStatusLabel,
  type IntegrationCategoryGroup,
  type IntegrationRegistryEntry,
} from "@/lib/integrations-registry";
import { cn } from "@/lib/utils";

function IntegrationLogo({
  name,
  logo,
  size = "md",
}: {
  name: string;
  logo: string;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const dim = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-8 w-8" : "h-11 w-11";
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (failed || !logo) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-xs font-semibold text-white/70",
          dim,
        )}
        aria-hidden
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt=""
      width={size === "lg" ? 56 : size === "sm" ? 32 : 44}
      height={size === "lg" ? 56 : size === "sm" ? 32 : 44}
      className={cn("shrink-0 rounded-xl object-contain p-1.5", dim)}
      onError={() => setFailed(true)}
    />
  );
}

function WizardModal({
  integration,
  onClose,
}: {
  integration: IntegrationRegistryEntry;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="integration-wizard-title"
        className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b1524] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <IntegrationLogo name={integration.name} logo={integration.logo} size="lg" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">
                Integration Wizard
              </p>
              <h3 id="integration-wizard-title" className="mt-1 text-lg font-semibold text-white">
                {integration.name}
              </h3>
              <p className="mt-1 text-xs text-white/45">{integration.vendor}</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg border border-white/10 p-1.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4">
          <span className="inline-flex rounded-full border border-amber-400/35 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100">
            {integrationStatusLabel(integration.status)}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-white/70">
          This Integration Wizard will guide you through connecting Unit311 Central with{" "}
          <span className="font-medium text-white">{integration.name}</span>.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          This feature is currently under development.
        </p>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-xl border border-sky-500/40 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-300 transition-colors hover:border-sky-400/60 hover:bg-sky-500/25"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({
  integration,
  onOpenWizard,
}: {
  integration: IntegrationRegistryEntry;
  onOpenWizard: (entry: IntegrationRegistryEntry) => void;
}) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400/35 hover:bg-white/[0.05] hover:shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-white/10 bg-[#0a1422] p-1 transition-colors group-hover:border-white/20">
          <IntegrationLogo name={integration.name} logo={integration.logo} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">{integration.name}</h3>
            <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-100/90">
              {integrationStatusLabel(integration.status)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-white/40">{integration.vendor}</p>
        </div>
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-white/55">{integration.description}</p>

      <button
        type="button"
        onClick={() => onOpenWizard(integration)}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-300 transition-colors hover:border-sky-400/60 hover:bg-sky-500/25"
      >
        <Plug className="h-3.5 w-3.5" />
        Integration Wizard
      </button>
    </article>
  );
}

/**
 * Integrations catalog — Tools section.
 * Renders entirely from the Supabase-backed Integration Registry.
 */
export default function IntegrationsWorkspace() {
  const [groups, setGroups] = useState<IntegrationCategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [active, setActive] = useState<IntegrationRegistryEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/catalog", { cache: "no-store" });
      const data = (await response.json()) as {
        integrations?: IntegrationRegistryEntry[];
        groups?: IntegrationCategoryGroup[];
        source?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Failed to load integrations");
      const nextGroups =
        data.groups?.length
          ? data.groups
          : groupIntegrationsByCategory(data.integrations ?? []);
      setGroups(nextGroups);
      setSource(data.source ?? "supabase");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load integrations");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">
            Tools
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">Integrations</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">
            Connect Unit311 Central to your existing business software using guided Integration
            Wizards.
          </p>
        </div>
        {source ? (
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/40">
            Registry · {source}
          </span>
        ) : null}
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex min-h-[16rem] items-center justify-center text-white/50">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center text-sm text-white/45">
          No integrations are available in the registry yet.
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.category} className="space-y-3">
            <div className="flex items-end justify-between gap-3 border-b border-white/10 pb-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/80">
                {group.label}
              </h3>
              <span className="text-[11px] text-white/35">
                {group.integrations.length}{" "}
                {group.integrations.length === 1 ? "integration" : "integrations"}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.integrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onOpenWizard={setActive}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {active ? <WizardModal integration={active} onClose={() => setActive(null)} /> : null}
    </div>
  );
}
