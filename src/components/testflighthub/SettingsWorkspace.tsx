"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import { isBrowserDemoSurface } from "@/lib/demo-enterprise";
import { filterInternalNavSectionsByGrants, filterInternalNavSectionsForDemoSurface } from "@/lib/internal-role-views";
import { resolveWorkspaceNavBaseSections } from "@/lib/platform-workspaces/workspace-nav-resolver";
import { resolveWorkspaceNavEnablement } from "@/lib/platform-workspaces/workspace-product-nav";
import { createInitialUsers, type ManagedUser } from "@/lib/user-management-data";
import { cn } from "@/lib/utils";
import {
  fetchCachedJson,
  PLATFORM_CACHE_KEYS,
} from "@/lib/platform-fetch-cache";
import {
  isPerformanceModeEnabled,
  setPerformanceModeEnabled,
} from "@/lib/platform-performance";
import {
  Activity,
  Bell,
  ChevronDown,
  Globe,
  Link2,
  Loader2,
  Mail,
  Menu,
  Share2,
  Trash2,
  Truck,
  Wallet,
} from "lucide-react";

import type { IntegrationConnectionPublic } from "@/lib/integration-framework-data";
import type { EmailAccount } from "@/lib/email/types";
import {
  loadRemovedMailboxIds,
  removeMailboxFromWorkspace,
  restoreMailboxToWorkspace,
} from "@/lib/email/removed-mailboxes";
import { useWebsiteMockStore } from "./useWebsiteMockStore";
import { isBrowserCorpCentreSurface } from "@/lib/corpcentre-surface";
import { ABHI_LINKEDIN_URL, ABHI_X_URL, isBrowserAbhiSurface } from "@/lib/abhi-surface";
import { isBrowserTalantonImpactSurface } from "@/lib/talanton-surface";
import type { InternalNavSection } from "@/lib/internal-operations-data";
import {
  applySidebarSectionOrder,
  getNavSectionTitle,
  isSettingsSection,
  loadSidebarNavCustom,
  saveSidebarNavCustom,
  type SidebarNavCustomStorage,
  type SidebarNavLeafItem,
} from "@/lib/sidebar-nav-custom";
import { SettingsSidebarReorderPanel } from "./SettingsSidebarReorderPanel";
import { useOperatorEntitlements } from "./OperatorEntitlementsProvider";

const MOCK_USERS = createInitialUsers();

type PlatformCredentials = {
  id: "linkedin" | "instagram" | "twitter";
  name: string;
  accent: string;
  accentBorder: string;
  icon: React.ReactNode;
  urlPlaceholder: string;
};

type IntegrationCredentials = {
  apiKey: string;
  tenantId: string;
  syncEnabled: boolean;
};

type FinanceProvider = "xero" | "sage" | "oracle" | "sage-payroll" | "zoho-payroll";
type LogisticsProvider = "fedex" | "ups" | "dhl";

type ProviderOption<T extends string> = {
  id: T;
  name: string;
};

type EmailMailboxRow = EmailAccount & { configured?: boolean };

const FINANCE_PROVIDERS: ProviderOption<FinanceProvider>[] = [
  { id: "xero", name: "Xero" },
  { id: "sage", name: "Sage" },
  { id: "oracle", name: "Oracle" },
  { id: "sage-payroll", name: "Sage Payroll" },
  { id: "zoho-payroll", name: "Zoho Payroll" },
];

const LOGISTICS_PROVIDERS: ProviderOption<LogisticsProvider>[] = [
  { id: "fedex", name: "FedEx" },
  { id: "ups", name: "UPS" },
  { id: "dhl", name: "DHL" },
];

function createEmptyIntegrationCredentials(): IntegrationCredentials {
  return { apiKey: "", tenantId: "", syncEnabled: false };
}

function createIntegrationCredentialsMap<T extends string>(
  providers: ProviderOption<T>[],
): Record<T, IntegrationCredentials> {
  return Object.fromEntries(
    providers.map((provider) => [provider.id, createEmptyIntegrationCredentials()]),
  ) as Record<T, IntegrationCredentials>;
}

type NavCustomStorage = SidebarNavCustomStorage;

const PLATFORMS: PlatformCredentials[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    accent: "from-[#0A66C2]/20 to-[#0A66C2]/5",
    accentBorder: "border-[#0A66C2]/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold text-white">
        in
      </span>
    ),
    urlPlaceholder: "https://www.linkedin.com/company/northstar-industrial",
  },
  {
    id: "instagram",
    name: "Instagram",
    accent: "from-fuchsia-500/20 via-pink-500/15 to-amber-500/10",
    accentBorder: "border-pink-400/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-[10px] font-bold text-white">
        IG
      </span>
    ),
    urlPlaceholder: "https://www.instagram.com/northstarindustrial",
  },
];

const INTERNAL_PLATFORMS: PlatformCredentials[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    accent: "from-[#0A66C2]/20 to-[#0A66C2]/5",
    accentBorder: "border-[#0A66C2]/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold text-white">
        in
      </span>
    ),
    urlPlaceholder: "https://www.linkedin.com/company/bcndrone",
  },
  {
    id: "instagram",
    name: "Instagram",
    accent: "from-fuchsia-500/20 via-pink-500/15 to-amber-500/10",
    accentBorder: "border-pink-400/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-[10px] font-bold text-white">
        IG
      </span>
    ),
    urlPlaceholder: "https://www.instagram.com/bcndrone",
  },
];

const ABHI_PLATFORMS: PlatformCredentials[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    accent: "from-[#0A66C2]/20 to-[#0A66C2]/5",
    accentBorder: "border-[#0A66C2]/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold text-white">
        in
      </span>
    ),
    urlPlaceholder: ABHI_LINKEDIN_URL,
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    accent: "from-white/15 to-white/5",
    accentBorder: "border-white/25",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-black text-[10px] font-bold text-white">
        X
      </span>
    ),
    urlPlaceholder: ABHI_X_URL,
  },
];

const TALANTON_PLATFORMS: PlatformCredentials[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    accent: "from-[#0A66C2]/20 to-[#0A66C2]/5",
    accentBorder: "border-[#0A66C2]/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold text-white">
        in
      </span>
    ),
    urlPlaceholder: "https://www.linkedin.com/company/talantonimpact",
  },
];

function resolveSettingsPlatforms(): PlatformCredentials[] {
  if (typeof window === "undefined") return INTERNAL_PLATFORMS;
  if (isBrowserAbhiSurface()) return ABHI_PLATFORMS;
  if (isBrowserTalantonImpactSurface()) return TALANTON_PLATFORMS;
  try {
    const { isBrowserDemoSurface } =
      require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
    if (isBrowserDemoSurface()) return PLATFORMS;
  } catch {
    // fall through
  }
  return INTERNAL_PLATFORMS;
}

const NOTIFICATION_FREQUENCIES = ["Immediate", "Hourly digest", "Daily digest", "Weekly summary"] as const;

function buildNotificationFunctionOptions(sections: InternalNavSection[]): string[] {
  const labels: string[] = [];
  for (const section of sections) {
    if (section.kind === "pin") {
      for (const item of section.items) {
        if (item.label) labels.push(item.label);
      }
      continue;
    }
    if (section.kind === "workspace") {
      const title = getNavSectionTitle(section);
      if (title) labels.push(title);
    }
    if (isSettingsSection(section)) labels.push("Settings");
  }
  return [...new Set(labels)];
}

function NotificationMultiSelect({
  label,
  options,
  selected,
  onChange,
  inputClassName,
}: {
  label: string;
  options: Array<{ id: string; label: string }>;
  selected: string[];
  onChange: (next: string[]) => void;
  inputClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const allSelected = options.length > 0 && options.every((option) => selected.includes(option.id));

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const summary =
    selected.length === 0
      ? "None selected"
      : selected.length === options.length
        ? "All selected"
        : `${selected.length} selected`;

  return (
    <div ref={rootRef} className="relative">
      <FieldLabel>{label}</FieldLabel>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(inputClassName, "mt-1.5 flex items-center justify-between gap-2 text-left")}
        aria-expanded={open}
      >
        <span className="truncate text-sm text-white/85">{summary}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/45 transition", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0b1524] p-1.5 shadow-xl">
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-white/5">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() =>
                onChange(allSelected ? [] : options.map((option) => option.id))
              }
              className="h-3.5 w-3.5 rounded border-white/20 bg-transparent accent-sky-500"
            />
            <span className="font-medium text-white/85">Select all</span>
          </label>
          {options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-white/5"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.id)}
                onChange={() =>
                  onChange(
                    selected.includes(option.id)
                      ? selected.filter((id) => id !== option.id)
                      : [...selected, option.id],
                  )
                }
                className="h-3.5 w-3.5 rounded border-white/20 bg-transparent accent-sky-500"
              />
              <span className="truncate text-white/85">{option.label}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function buildLiveNavSections(
  allowedViews: Parameters<typeof filterInternalNavSectionsByGrants>[1],
  workspaceSlug: string | null,
  workspaceType: string | null,
  enabledModules: string[] | null,
  enabledSubModules: string[] | null,
  entitlementsReady: boolean,
): InternalNavSection[] {
  if (typeof window === "undefined") return [...internalSurveyNavSections];
  const enablement = resolveWorkspaceNavEnablement({
    workspaceSlug,
    workspaceType,
    enabledModules,
    enabledSubModules,
    allowDefaultFallback: entitlementsReady,
  });
  const base = resolveWorkspaceNavBaseSections({
    workspaceSlug,
    workspaceType,
    enablement,
  });
  return filterInternalNavSectionsForDemoSurface(
    filterInternalNavSectionsByGrants(base, allowedViews),
    { allowHostSurfaces: true },
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
      {children}
    </label>
  );
}

function inputClassName() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-400/50 placeholder:text-white/30";
}

function SettingsColumn({
  title,
  description,
  icon,
  accentClass,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  accentClass?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl xl:min-h-[32rem]",
        accentClass,
      )}
    >
      <header className="shrink-0 border-b border-white/10 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-sky-300">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-white/45">{description}</p>
          </div>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </section>
  );
}

function PlatformCredentialsCard({ platform }: { platform: PlatformCredentials }) {
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border bg-[#0b1524]/40",
        platform.accentBorder,
      )}
    >
      <div className={cn("border-b border-white/10 bg-gradient-to-r px-3 py-3", platform.accent)}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-black/30 text-white">
            {platform.icon}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">{platform.name}</h3>
            <p className="text-[10px] text-white/45">Account credentials</p>
          </div>
        </div>
      </div>

      <form
        className="space-y-3 p-3"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <div>
          <FieldLabel>URL</FieldLabel>
          <input
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder={platform.urlPlaceholder}
            className={inputClassName()}
          />
        </div>

        <div>
          <FieldLabel>Username</FieldLabel>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder={`${platform.name} username`}
            autoComplete="username"
            className={inputClassName()}
          />
        </div>

        <div>
          <FieldLabel>Password</FieldLabel>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className={inputClassName()}
          />
        </div>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:border-sky-400/40 hover:text-white"
        >
          Save credentials
        </button>
      </form>
    </article>
  );
}

function ProviderIntegrationSection<T extends string>({
  title,
  description,
  icon,
  providers,
  selectedProvider,
  onSelectProvider,
  credentials,
  onChangeCredentials,
  tenantLabel = "Tenant ID",
  tenantPlaceholder = "Tenant or organisation ID",
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  providers: ProviderOption<T>[];
  selectedProvider: T | "";
  onSelectProvider: (provider: T | "") => void;
  credentials: IntegrationCredentials;
  onChangeCredentials: (next: IntegrationCredentials) => void;
  tenantLabel?: string;
  tenantPlaceholder?: string;
}) {
  const activeProvider = providers.find((provider) => provider.id === selectedProvider);

  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1524]/40">
      <div className="border-b border-white/10 bg-white/[0.03] px-3 py-3">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-sky-300">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-[10px] text-white/45">{description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-3">
        <div>
          <FieldLabel>Provider</FieldLabel>
          <select
            value={selectedProvider}
            onChange={(event) => onSelectProvider(event.target.value as T | "")}
            className={inputClassName()}
          >
            <option value="">Choose provider…</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProvider && activeProvider ? (
          <div className="space-y-3 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-emerald-200/80">
              {activeProvider.name} connection
            </p>
            <div>
              <FieldLabel>API key</FieldLabel>
              <input
                type="password"
                value={credentials.apiKey}
                onChange={(event) =>
                  onChangeCredentials({ ...credentials, apiKey: event.target.value })
                }
                placeholder={`${activeProvider.name} API key`}
                className={inputClassName()}
              />
            </div>
            <div>
              <FieldLabel>{tenantLabel}</FieldLabel>
              <input
                type="text"
                value={credentials.tenantId}
                onChange={(event) =>
                  onChangeCredentials({ ...credentials, tenantId: event.target.value })
                }
                placeholder={tenantPlaceholder}
                className={inputClassName()}
              />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b1524]/60 px-3 py-2.5">
              <input
                type="checkbox"
                checked={credentials.syncEnabled}
                onChange={(event) =>
                  onChangeCredentials({ ...credentials, syncEnabled: event.target.checked })
                }
                className="h-4 w-4 rounded border-white/20 bg-transparent accent-emerald-500"
              />
              <span className="text-sm text-white/75">Enable automatic sync</span>
            </label>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function DemoResetSettingsColumn() {
  const [username, setUsername] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/auth/whoami", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUsername(data?.username ?? null))
      .catch(() => undefined);
  }, []);

  const isAdmin =
    String(username ?? "")
      .trim()
      .toLowerCase() === "admin@unit311central.com";

  async function handleReset() {
    if (!isAdmin || !window.confirm("Reset Demo to Northstar baseline? This wipes and reseeds Demo data.")) {
      return;
    }
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setStatus("done");
      setMessage(data.message ?? "Demo reset complete.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Reset failed");
    }
  }

  return (
    <SettingsColumn
      title="Demo workspace"
      description="Admin-only — reseed Northstar Industrial Technologies baseline data."
      icon={<Share2 className="h-4 w-4" />}
      accentClass="border-amber-400/25"
    >
      <div className="space-y-3">
        <p className="text-xs text-white/55">
          Wipes Demo business data and reseeds from the deterministic Northstar graph. Never touches
          Internal, OnwardAir, Talanton or ABHI.
        </p>
        <button
          type="button"
          disabled={!isAdmin || status === "loading"}
          onClick={() => void handleReset()}
          className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-100 disabled:opacity-40"
        >
          {status === "loading" ? "Resetting…" : "Reset Demo to baseline"}
        </button>
        {!isAdmin ? (
          <p className="text-[10px] text-white/40">Sign in as admin@unit311central.com to reset.</p>
        ) : null}
        {message ? <p className="text-xs text-white/70">{message}</p> : null}
      </div>
    </SettingsColumn>
  );
}

export default function SettingsWorkspace() {
  const [hydrated, setHydrated] = useState(false);
  const { allowedViews, ready: entitlementsReady, workspaceSlug, workspaceType, enabledModules, enabledSubModules } = useOperatorEntitlements();
  const liveSections = useMemo(
    () =>
      hydrated
        ? buildLiveNavSections(
            entitlementsReady ? allowedViews : null,
            workspaceSlug,
            workspaceType,
            enabledModules,
            enabledSubModules,
            entitlementsReady,
          )
        : [...internalSurveyNavSections],
    [hydrated, allowedViews, entitlementsReady, workspaceSlug, workspaceType, enabledModules, enabledSubModules],
  );
  const [navCustom, setNavCustom] = useState<NavCustomStorage>(() => ({
    version: 6,
    sectionOrder: [],
    customized: false,
    hidden: {},
    customItems: [],
  }));
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [customNavLabel, setCustomNavLabel] = useState("");
  const [hideWebsiteCms, setHideWebsiteCms] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setHideWebsiteCms(isBrowserCorpCentreSurface());
  }, []);

  // Load once host sections are ready — never seed from the generic (non-OA) nav
  // list, which used to shrink/overwrite a full custom order on refresh.
  useEffect(() => {
    if (!hydrated || !entitlementsReady) return;
    setNavCustom(loadSidebarNavCustom(liveSections));
  }, [hydrated, entitlementsReady, liveSections]);

  const [financeProvider, setFinanceProvider] = useState<FinanceProvider | "">("");
  const [logisticsProvider, setLogisticsProvider] = useState<LogisticsProvider | "">("");

  const [financeCredentials, setFinanceCredentials] = useState<
    Record<FinanceProvider, IntegrationCredentials>
  >(() => createIntegrationCredentialsMap(FINANCE_PROVIDERS));
  const [logisticsCredentials, setLogisticsCredentials] = useState<
    Record<LogisticsProvider, IntegrationCredentials>
  >(() => createIntegrationCredentialsMap(LOGISTICS_PROVIDERS));

  const [mailboxes, setMailboxes] = useState<EmailMailboxRow[]>([]);
  const [removedMailboxIds, setRemovedMailboxIds] = useState<string[]>([]);
  const [mailboxesLoading, setMailboxesLoading] = useState(true);
  const [mailboxActionError, setMailboxActionError] = useState<string | null>(null);

  const [phoneNotifications, setPhoneNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notificationFunctionIds, setNotificationFunctionIds] = useState<string[]>([]);
  const [alertUserIds, setAlertUserIds] = useState<string[]>([]);
  const [platformUsers, setPlatformUsers] = useState<ManagedUser[]>(MOCK_USERS);
  const [usersLoading, setUsersLoading] = useState(true);
  const [notificationFrequency, setNotificationFrequency] =
    useState<(typeof NOTIFICATION_FREQUENCIES)[number]>("Daily digest");

  const websiteStore = useWebsiteMockStore();
  const [frameworkConnections, setFrameworkConnections] = useState<
    IntegrationConnectionPublic[]
  >([]);
  const [frameworkLoadState, setFrameworkLoadState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [showPerfControls, setShowPerfControls] = useState(false);
  const [perfModeOn, setPerfModeOn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchCachedJson<{ role?: string | null; username?: string; userType?: string }>(
      PLATFORM_CACHE_KEYS.whoami,
      "/api/auth/whoami",
      { ttlMs: 120_000 },
    )
      .then((data) => {
        if (cancelled) return;
        const role = (data.role ?? "").toLowerCase();
        const admin =
          role === "admin" ||
          role === "administrator" ||
          role === "c-suite" ||
          data.username === "scott.parazynski";
        setShowPerfControls(admin);
        setPerfModeOn(isPerformanceModeEnabled());
      })
      .catch(() => {
        if (!cancelled) setShowPerfControls(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFrameworkLoadState("loading");
    void fetch("/api/integrations/connections")
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load connections");
        const payload = (await response.json()) as {
          connections?: IntegrationConnectionPublic[];
        };
        if (cancelled) return;
        setFrameworkConnections(payload.connections ?? []);
        setFrameworkLoadState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setFrameworkLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMailboxesLoading(true);
    setRemovedMailboxIds(loadRemovedMailboxIds());
    void fetch("/api/email/accounts", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as EmailMailboxRow[] | { error?: string };
        if (cancelled) return;
        if (!response.ok || !Array.isArray(payload)) {
          throw new Error(
            !Array.isArray(payload) && payload.error
              ? payload.error
              : "Failed to load mailboxes",
          );
        }
        setMailboxes(payload);
        setMailboxActionError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setMailboxes([]);
        setMailboxActionError(
          error instanceof Error ? error.message : "Failed to load mailboxes",
        );
      })
      .finally(() => {
        if (!cancelled) setMailboxesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeMailboxes = useMemo(
    () => mailboxes.filter((mailbox) => !removedMailboxIds.includes(mailbox.id)),
    [mailboxes, removedMailboxIds],
  );
  const removedMailboxes = useMemo(
    () => mailboxes.filter((mailbox) => removedMailboxIds.includes(mailbox.id)),
    [mailboxes, removedMailboxIds],
  );

  function handleRemoveMailbox(accountId: string) {
    removeMailboxFromWorkspace(accountId);
    setRemovedMailboxIds(loadRemovedMailboxIds());
    setMailboxActionError(null);
  }

  function handleRestoreMailbox(accountId: string) {
    restoreMailboxToWorkspace(accountId);
    setRemovedMailboxIds(loadRemovedMailboxIds());
    setMailboxActionError(null);
  }

  const websiteConnections = useMemo(
    () => frameworkConnections.filter((row) => row.category === "website"),
    [frameworkConnections],
  );

  const orderedSections = useMemo(
    () => applySidebarSectionOrder(liveSections, navCustom),
    [liveSections, navCustom],
  );

  const notificationFunctionOptions = useMemo(
    () => buildNotificationFunctionOptions(orderedSections),
    [orderedSections],
  );

  useEffect(() => {
    if (notificationFunctionOptions.length === 0) return;
    setNotificationFunctionIds((current) =>
      current.length > 0 ? current : [...notificationFunctionOptions],
    );
  }, [notificationFunctionOptions]);

  useEffect(() => {
    let cancelled = false;
    setUsersLoading(true);
    void fetch("/api/messaging/operators", { cache: "no-store", credentials: "include" })
      .then(async (response) => {
        const payload = (await response.json()) as { users?: ManagedUser[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Failed to load users");
        return payload.users ?? [];
      })
      .then((users) => {
        if (cancelled) return;
        const activeUsers = users.filter((user) => user.status === "Active");
        setPlatformUsers(activeUsers.length > 0 ? activeUsers : MOCK_USERS);
        setAlertUserIds((current) =>
          current.length > 0 ? current : activeUsers.map((user) => user.id),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setPlatformUsers(MOCK_USERS);
        setAlertUserIds((current) =>
          current.length > 0 ? current : MOCK_USERS.map((user) => user.id),
        );
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persistNavCustom = useCallback((next: NavCustomStorage) => {
    setNavCustom(next);
    saveSidebarNavCustom(next);
  }, []);

  function toggleModuleExpanded(sectionKey: string) {
    setExpandedModules((current) => ({ ...current, [sectionKey]: !current[sectionKey] }));
  }

  function toggleNavHidden(itemId: string) {
    persistNavCustom({
      ...navCustom,
      hidden: { ...navCustom.hidden, [itemId]: !navCustom.hidden[itemId] },
    });
  }

  function addCustomNavItem() {
    const label = customNavLabel.trim();
    if (!label) return;
    const id = `nav-custom-${Date.now()}`;
    const item: SidebarNavLeafItem = {
      id,
      label,
      sectionKey: "workspace:Custom",
      custom: true,
    };
    persistNavCustom({
      ...navCustom,
      customItems: [...navCustom.customItems, item],
    });
    setCustomNavLabel("");
  }

  const demoSurface = hydrated && isBrowserDemoSurface();
  const websiteConnectionsForDisplay = useMemo(() => {
    if (demoSurface) {
      return [
        {
          id: "nst-cms-northstar",
          displayLabel: "Northstar",
          providerCode: "cms.wordpress",
          providerDisplayName: "Northstar CMS",
          status: "connected" as const,
          credentialsSet: true,
        },
      ];
    }
    return websiteConnections;
  }, [demoSurface, websiteConnections]);

  return (
    <div className="space-y-4">
      {showPerfControls ? (
        <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-200">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Performance Mode</h2>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/50">
                  Admin-only overlay for page load, API timings, cache hit rate, and JS weight.
                  Toggle anytime from the floating control.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !perfModeOn;
                setPerformanceModeEnabled(next);
                setPerfModeOn(next);
              }}
              className={cn(
                "inline-flex h-9 items-center rounded-xl border px-3 text-xs font-semibold transition-colors",
                perfModeOn
                  ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
                  : "border-white/15 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]",
              )}
            >
              {perfModeOn ? "Enabled" : "Enable"}
            </button>
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
        <SettingsColumn
          title="Integrations"
          description={
            hideWebsiteCms
              ? "Finance, logistics, and email connections."
              : "Finance, logistics, email, and website CMS connections."
          }
          icon={<Link2 className="h-4 w-4" />}
          accentClass="border-emerald-400/20"
        >
          <div className="space-y-3">
            {!hideWebsiteCms ? (
            <div className="rounded-xl border border-white/10 bg-[#0b1524]/60 p-3">
              <div className="mb-2 flex items-center gap-2 text-sky-300">
                <Globe className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
                  Website CMS
                </p>
              </div>
              <p className="mb-3 text-[11px] leading-relaxed text-white/45">
                {demoSurface
                  ? "Northstar public website CMS — connected through the Integration Framework."
                  : "Managed through Website Management and stored in the Integration Framework — not a second credential store."}
              </p>
              {frameworkLoadState === "loading" && !demoSurface ? (
                <p className="text-xs text-white/45">Loading framework connections…</p>
              ) : null}
              {websiteConnectionsForDisplay.length > 0 ? (
                <ul className="space-y-2">
                  {websiteConnectionsForDisplay.map((connection) => (
                    <li
                      key={connection.id}
                      className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-2"
                    >
                      <p className="text-xs font-medium text-white">
                        {connection.displayLabel || connection.providerDisplayName}
                      </p>
                      <p className="mt-0.5 text-[10px] text-white/50">
                        {connection.providerCode} · {connection.status}
                        {connection.credentialsSet ? " · credentials set" : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : !demoSurface ? (
                <ul className="space-y-2">
                  {websiteStore.websites.map((site) => (
                    <li
                      key={site.id}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2"
                    >
                      <p className="text-xs font-medium text-white">{site.name}</p>
                      <p className="mt-0.5 text-[10px] text-white/50">
                        {site.providerCode} · {site.cms} · {site.connectionStatus}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
              {frameworkLoadState === "error" && !demoSurface ? (
                <p className="mt-2 text-[10px] text-amber-200/80">
                  Framework API unavailable — showing Website Management local connections until
                  migration 099 is applied.
                </p>
              ) : null}
            </div>
            ) : null}

            <ProviderIntegrationSection
              title="Finance"
              description="Accounting and payroll systems."
              icon={<Wallet className="h-4 w-4" />}
              providers={FINANCE_PROVIDERS}
              selectedProvider={financeProvider}
              onSelectProvider={setFinanceProvider}
              credentials={
                financeProvider
                  ? financeCredentials[financeProvider]
                  : createEmptyIntegrationCredentials()
              }
              onChangeCredentials={(next) => {
                if (!financeProvider) return;
                setFinanceCredentials((current) => ({
                  ...current,
                  [financeProvider]: next,
                }));
              }}
            />

            <ProviderIntegrationSection
              title="Logistics"
              description="Courier and shipping APIs."
              icon={<Truck className="h-4 w-4" />}
              providers={LOGISTICS_PROVIDERS}
              selectedProvider={logisticsProvider}
              onSelectProvider={setLogisticsProvider}
              credentials={
                logisticsProvider
                  ? logisticsCredentials[logisticsProvider]
                  : createEmptyIntegrationCredentials()
              }
              onChangeCredentials={(next) => {
                if (!logisticsProvider) return;
                setLogisticsCredentials((current) => ({
                  ...current,
                  [logisticsProvider]: next,
                }));
              }}
              tenantLabel="Account number"
              tenantPlaceholder="Shipper or account number"
            />

            <article className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1524]/40">
              <div className="border-b border-white/10 bg-white/[0.03] px-3 py-3">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-sky-300">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white">Email mailboxes</h3>
                    <p className="text-[10px] text-white/45">
                      Remove mailboxes from the Email workspace list for this workspace. You can
                      restore them later.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-3">
                {mailboxesLoading ? (
                  <p className="inline-flex items-center gap-2 text-xs text-white/50">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading mailboxes…
                  </p>
                ) : null}

                {mailboxActionError ? (
                  <p className="rounded-lg border border-rose-400/25 bg-rose-500/10 px-2.5 py-2 text-[11px] text-rose-100">
                    {mailboxActionError}
                  </p>
                ) : null}

                {!mailboxesLoading && activeMailboxes.length === 0 ? (
                  <p className="text-[11px] text-white/45">No active mailboxes.</p>
                ) : null}

                <ul className="space-y-1.5">
                  {activeMailboxes.map((mailbox) => (
                    <li
                      key={mailbox.id}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b1524]/60 px-2.5 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white/90">
                          {mailbox.email}
                        </p>
                        <p className="truncate text-[10px] text-white/40">
                          {mailbox.name}
                          {mailbox.configured ? " · Connected" : " · Not connected"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMailbox(mailbox.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-400/25 bg-rose-500/10 px-2 py-1 text-[10px] font-medium text-rose-100 hover:bg-rose-500/15"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>

                {removedMailboxes.length > 0 ? (
                  <div className="space-y-1.5 border-t border-white/10 pt-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                      Removed
                    </p>
                    <ul className="space-y-1.5">
                      {removedMailboxes.map((mailbox) => (
                        <li
                          key={mailbox.id}
                          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2 opacity-80"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs text-white/70">{mailbox.email}</p>
                            <p className="truncate text-[10px] text-white/35">{mailbox.name}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRestoreMailbox(mailbox.id)}
                            className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-medium text-white/70 hover:bg-white/[0.04] hover:text-white"
                          >
                            Restore
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </article>

            <p className="text-[10px] leading-relaxed text-white/35">
              Finance and logistics credentials remain local until those connectors ship.
              Removed mailboxes are hidden from the Email workspace on this browser.
              {hideWebsiteCms
                ? ""
                : " Website CMS connections use the Integration Framework."}
            </p>
          </div>
        </SettingsColumn>

        <SettingsColumn
          title="Sidebar"
          description="Drag modules to reorder the left nav. One shared order applies across the whole workspace."
          icon={<Menu className="h-4 w-4" />}
          accentClass="border-violet-400/20"
        >
          <SettingsSidebarReorderPanel
            orderedSections={orderedSections}
            navCustom={navCustom}
            expandedModules={expandedModules}
            customNavLabel={customNavLabel}
            onCustomNavLabelChange={setCustomNavLabel}
            onPersistNavCustom={persistNavCustom}
            onToggleModuleExpanded={toggleModuleExpanded}
            onToggleNavHidden={toggleNavHidden}
            onAddCustomNavItem={addCustomNavItem}
            inputClassName={inputClassName()}
          />
        </SettingsColumn>

        <SettingsColumn
          title="Notifications"
          description="Phone, email, module alerts, and digest preferences for platform users."
          icon={<Bell className="h-4 w-4" />}
          accentClass="border-amber-400/20"
        >
          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0b1524]/60 px-3 py-2.5">
              <span className="text-xs text-white/80">Phone notifications</span>
              <input
                type="checkbox"
                checked={phoneNotifications}
                onChange={(event) => setPhoneNotifications(event.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-transparent accent-sky-500"
              />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0b1524]/60 px-3 py-2.5">
              <span className="text-xs text-white/80">Email notifications</span>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(event) => setEmailNotifications(event.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-transparent accent-sky-500"
              />
            </label>

            <NotificationMultiSelect
              label="Functions"
              options={notificationFunctionOptions.map((label) => ({ id: label, label }))}
              selected={notificationFunctionIds}
              onChange={setNotificationFunctionIds}
              inputClassName={inputClassName()}
            />

            <NotificationMultiSelect
              label="Alert users"
              options={platformUsers.map((user) => ({
                id: user.id,
                label: user.fullName || user.username,
              }))}
              selected={alertUserIds}
              onChange={setAlertUserIds}
              inputClassName={inputClassName()}
            />
            {usersLoading ? (
              <p className="text-[10px] text-white/40">Loading platform users…</p>
            ) : null}

            <div>
              <FieldLabel>Frequency</FieldLabel>
              <select
                value={notificationFrequency}
                onChange={(event) =>
                  setNotificationFrequency(
                    event.target.value as (typeof NOTIFICATION_FREQUENCIES)[number],
                  )
                }
                className={inputClassName()}
              >
                {NOTIFICATION_FREQUENCIES.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {frequency}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SettingsColumn>

        <SettingsColumn
          title="Social accounts"
          description={
            isBrowserAbhiSurface()
              ? "LinkedIn and X (Twitter) publishing credentials."
              : "LinkedIn and Instagram publishing credentials."
          }
          icon={<Share2 className="h-4 w-4" />}
          accentClass="border-pink-400/20"
        >
          <div className="space-y-3">
            {resolveSettingsPlatforms().map((platform) => (
              <PlatformCredentialsCard key={platform.id} platform={platform} />
            ))}
            <p className="text-[10px] leading-relaxed text-white/35">
              Mockup only — these credentials will power the Social workspace when integrations go
              live.
            </p>
          </div>
        </SettingsColumn>

        {hydrated && isBrowserDemoSurface() ? (
          <DemoResetSettingsColumn />
        ) : null}
      </div>
    </div>
  );
}
