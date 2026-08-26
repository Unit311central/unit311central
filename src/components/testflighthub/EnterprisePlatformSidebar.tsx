"use client";

import { startTransition, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  ContactRound,
  Cpu,
  FlaskConical,
  FolderKanban,
  FolderOpen,
  Globe,
  GraduationCap,
  Handshake,
  HardDrive,
  HeartHandshake,
  KeyRound,
  Landmark,
  Laptop,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  Lightbulb,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Network,
  Package,
  PenLine,
  Plug,
  Presentation,
  Radio,
  Receipt,
  ScrollText,
  Server,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Ticket,
  Truck,
  UserRound,
  Users,
  Video,
  Wallet,
  Wrench,
  X,
} from "lucide-react";

import WorkspaceSidebarBrand from "@/components/layout/WorkspaceSidebarBrand";
import {
  internalSurveyNavSections,
  isInternalNavChildActive,
  isInternalNavItemActive,
  type InternalNavChildItem,
  type InternalNavItem,
  type InternalNavSection,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import { filterInternalNavSectionsByGrants, filterInternalNavSectionsForDemoSurface } from "@/lib/internal-role-views";
import { injectTestWorkspaceQaNav } from "@/lib/qa-workspace/nav";
import { resolveWorkspaceNavBaseSections } from "@/lib/platform-workspaces/workspace-nav-resolver";
import { resolveWorkspaceNavEnablement } from "@/lib/platform-workspaces/workspace-product-nav";
import { parseClientPlatformSubdomainSafe, isInternalDomainHost } from "@/lib/app-domains";
import { isAbsoluteHttpUrl } from "@/lib/clarity";
import {
  resolveOnwardAirNavAccent,
} from "@/lib/onwardair-surface";
import { isBrowserAbhiSurface } from "@/lib/abhi-surface";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import { isBrowserTalantonImpactSurface } from "@/lib/talanton-surface";
import {
  getSidebarTheme,
  readSidebarExpandedState,
  readSidebarThemeId,
  writeSidebarExpandedState,
  type SidebarThemeTokens,
} from "@/lib/sidebar-chrome";
import {
  applySidebarSectionOrder,
  loadSidebarNavCustom,
  reconcileSidebarNavCustom,
  SIDEBAR_NAV_CUSTOM_EVENT,
} from "@/lib/sidebar-nav-custom";
import type { SurveyOperationsBasePath } from "@/lib/survey-operations-mock-data";
import { cn } from "@/lib/utils";
import { useOperatorEntitlements } from "./OperatorEntitlementsProvider";

const iconMap = {
  Activity,
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  ContactRound,
  Cpu,
  FlaskConical,
  FolderKanban,
  FolderOpen,
  Globe,
  GraduationCap,
  Handshake,
  HardDrive,
  HeartHandshake,
  KeyRound,
  Landmark,
  Laptop,
  Layers,
  LifeBuoy,
  Lightbulb,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Network,
  Package,
  PenLine,
  Plug,
  Presentation,
  AlertTriangle,
  Radio,
  Receipt,
  ScrollText,
  Server,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Ticket,
  Truck,
  UserRound,
  Users,
  Video,
  Wallet,
  Wrench,
} as const;

const SUBMENU_ICON = "text-[#8B9BB0]";
const NESTED_TEXT = "text-[#D7DEE8]";

/** Near-instant expand — never delay the user. */
const EXPAND_MS = 110;

const WORKSPACE_HEADER_H = 32;
const CARD_PAD_X = 7;
const CARD_GAP = 8;
/** Primary module row typography — compact so full labels stay readable in the LHS column. */
const SIDEBAR_LEAF_FONT_PX = 10;
const SIDEBAR_NESTED_FONT_PX = 9;
const SIDEBAR_MODULE_HEADER_FONT_PX = 9;
/** Compact module rows on /overview “CLICK BELOW TO VIEW” rail. */
const OVERVIEW_EMBED_ITEM_H = 30;
const OVERVIEW_EMBED_GAP = 5;
const OVERVIEW_EMBED_FONT_PX = 8.5;

type EnterprisePlatformSidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
  activeView?: InternalOperationsView;
  onViewChange?: (view: InternalOperationsView, query?: Record<string, string>) => void;
  basePath?: SurveyOperationsBasePath;
  onPrefetchView?: (view: InternalOperationsView) => void;
  /** Overview invite: hide brand/logout; show “CLICK BELOW TO VIEW”. */
  overviewEmbed?: boolean;
};

function resolveIcon(name?: string) {
  if (!name) return LayoutDashboard;
  return iconMap[name as keyof typeof iconMap] ?? LayoutDashboard;
}

function cardShellStyle(theme: SidebarThemeTokens): CSSProperties {
  return {
    background: theme.card,
    borderColor: theme.cardBorder,
  };
}

/** Height-only transition — no opacity fade (avoids accordion/material feel). */
function expandPanelClass(isOpen: boolean) {
  return cn(
    "grid transition-[grid-template-rows] ease-out",
    isOpen ? "grid-rows-[1fr]" : "pointer-events-none grid-rows-[0fr]",
  );
}

/** User collapsed set overrides auto-open from active route; explicit true forces open. */
function splitStoredExpandedState(stored: Record<string, boolean>) {
  const expandedTrue: Record<string, boolean> = {};
  const collapsed = new Set<string>();
  for (const [key, value] of Object.entries(stored)) {
    if (value === false) collapsed.add(key);
    else if (value === true) expandedTrue[key] = true;
  }
  return { expandedTrue, collapsed };
}

function resolveNavOpen(
  expanded: Record<string, boolean>,
  collapsedKeys: Set<string>,
  key: string,
  autoOpen: boolean,
): boolean {
  if (collapsedKeys.has(key)) return false;
  if (expanded[key] === true) return true;
  return autoOpen;
}

function mergeExpandedForStorage(
  expanded: Record<string, boolean>,
  collapsedKeys: Set<string>,
): Record<string, boolean> {
  const merged: Record<string, boolean> = { ...expanded };
  for (const key of collapsedKeys) merged[key] = false;
  return merged;
}

export default function EnterprisePlatformSidebar({
  mobileOpen = false,
  onClose,
  activeView = "home",
  onViewChange,
  basePath = "/internaldashboard",
  onPrefetchView,
  overviewEmbed = false,
}: EnterprisePlatformSidebarProps) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(() => new Set());
  const [theme, setTheme] = useState<SidebarThemeTokens>(() => getSidebarTheme(readSidebarThemeId()));
  const [hydrated, setHydrated] = useState(false);
  const [sectionOrderTick, setSectionOrderTick] = useState(0);

  const [isInternalOpsHost] = useState(() => {
    if (basePath === "/dashboard" || basePath === "/overview") return false;
    if (typeof window !== "undefined" && isInternalDomainHost(window.location.hostname)) {
      return true;
    }
    return basePath === "/" || basePath === "/internaldashboard" || basePath === "/internaldashboard_grants";
  });
  const [isTalantonSurface] = useState(
    () => typeof window !== "undefined" && isBrowserTalantonImpactSurface(),
  );
  const [isAbhiSurface] = useState(
    () => typeof window !== "undefined" && isBrowserAbhiSurface(),
  );
  /** Inject host-specific nav on first paint — do not wait for sidebar hydration. */
  const [customerHostNav] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const { isBrowserSaecSurface } =
        require("@/lib/saec-surface") as typeof import("@/lib/saec-surface");
      return (
        isBrowserTalantonImpactSurface() ||
        isBrowserOnwardAirSurface() ||
        isBrowserAbhiSurface() ||
        isBrowserSaecSurface()
      );
    } catch {
      return (
        isBrowserTalantonImpactSurface() ||
        isBrowserOnwardAirSurface() ||
        isBrowserAbhiSurface()
      );
    }
  });
  /** Talanton / ABHI + overview embed: every load starts with modules collapsed; prefs stay session-local. */
  const sessionOnlyExpand = overviewEmbed || isTalantonSurface || isAbhiSurface;

  useEffect(() => {
    startTransition(() => {
      if (sessionOnlyExpand) {
        setExpanded({});
        setCollapsedKeys(new Set());
      } else {
        const { expandedTrue, collapsed } = splitStoredExpandedState(readSidebarExpandedState());
        setExpanded(expandedTrue);
        setCollapsedKeys(collapsed);
      }
      setTheme(getSidebarTheme(readSidebarThemeId()));
      setHydrated(true);
    });
  }, [sessionOnlyExpand]);

  useEffect(() => {
    const onCustom = () => setSectionOrderTick((n) => n + 1);
    window.addEventListener(SIDEBAR_NAV_CUSTOM_EVENT, onCustom);
    window.addEventListener("storage", onCustom);
    return () => {
      window.removeEventListener(SIDEBAR_NAV_CUSTOM_EVENT, onCustom);
      window.removeEventListener("storage", onCustom);
    };
  }, []);

  const { allowedViews, ready: entitlementsReady, workspaceSlug, workspaceType, enabledModules, enabledSubModules } = useOperatorEntitlements();

  const hostWorkspaceSlug = useMemo(() => {
    if (typeof window === "undefined") return null;
    return parseClientPlatformSubdomainSafe(window.location.hostname);
  }, []);

  const effectiveWorkspaceSlug = workspaceSlug ?? hostWorkspaceSlug;

  const workspaceNavEnablement = useMemo(
    () =>
      resolveWorkspaceNavEnablement({
        workspaceSlug: effectiveWorkspaceSlug,
        workspaceType,
        enabledModules,
        enabledSubModules,
        allowDefaultFallback: entitlementsReady,
      }),
    [effectiveWorkspaceSlug, workspaceType, enabledModules, enabledSubModules, entitlementsReady],
  );

  const workspaceNavBase = useMemo(
    () =>
      resolveWorkspaceNavBaseSections({
        workspaceSlug: effectiveWorkspaceSlug,
        workspaceType,
        enablement: workspaceNavEnablement,
      }),
    [effectiveWorkspaceSlug, workspaceType, workspaceNavEnablement],
  );

  // Only migrate / insert brand-new module keys. Do not rewrite storage when
  // entitlements or host filters change — that was wiping Settings reorders.
  useEffect(() => {
    if (!hydrated || !entitlementsReady) return;
    const filtered = filterInternalNavSectionsForDemoSurface(
      filterInternalNavSectionsByGrants(workspaceNavBase, allowedViews),
      { allowHostSurfaces: true },
    );
    reconcileSidebarNavCustom(filtered, effectiveWorkspaceSlug);
  }, [hydrated, allowedViews, entitlementsReady, workspaceNavBase, effectiveWorkspaceSlug]);

  useEffect(() => {
    const onTheme = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setTheme(getSidebarTheme(detail));
    };
    window.addEventListener("unit311-sidebar-theme", onTheme);
    window.addEventListener("unit311-platform-theme", onTheme);
    return () => {
      window.removeEventListener("unit311-sidebar-theme", onTheme);
      window.removeEventListener("unit311-platform-theme", onTheme);
    };
  }, []);

  useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function toggleExpanded(key: string, isOpen: boolean) {
    setCollapsedKeys((currentCollapsed) => {
      const nextCollapsed = new Set(currentCollapsed);
      if (isOpen) nextCollapsed.add(key);
      else nextCollapsed.delete(key);

      setExpanded((currentExpanded) => {
        const nextExpanded = { ...currentExpanded };
        if (isOpen) {
          delete nextExpanded[key];
        } else {
          nextExpanded[key] = true;
        }
        if (!sessionOnlyExpand) {
          writeSidebarExpandedState(mergeExpandedForStorage(nextExpanded, nextCollapsed));
        }
        return nextExpanded;
      });

      return nextCollapsed;
    });
  }

  function navigate(view: InternalOperationsView, query?: Record<string, string>) {
    onViewChange?.(view, query);
    onClose?.();
  }

  function childLabel(child: InternalNavChildItem) {
    if (child.view === "billing" && isInternalOpsHost) return "Billing";
    return child.label;
  }

  /** Destinations only — active pill lives here, never on category parents. */
  function renderLeaf(
    key: string,
    label: string,
    active: boolean,
    opts: {
      view?: InternalOperationsView;
      href?: string;
      query?: Record<string, string>;
      icon?: string;
      depth: number;
      badge?: "demo";
    },
  ) {
    const nested = opts.depth > 0;
    const Icon = resolveIcon(opts.icon);
    const className = cn(
      "flex w-full items-center text-left transition-colors duration-75",
      nested
        ? cn(
            "h-6 gap-0 rounded-md py-0 pl-6 pr-1 font-normal leading-[1.25]",
            NESTED_TEXT,
          )
        : "h-[26px] gap-1.5 rounded-md py-0 pl-1 pr-1 font-medium leading-[1.25] text-white/88",
      active
        ? "text-white"
        : nested
          ? "hover:bg-white/[0.04] hover:text-white"
          : "hover:bg-white/[0.04] hover:text-white",
    );
    const style = active
      ? {
          background: "#1F4FBF",
          color: "#FFFFFF",
          fontSize: nested ? SIDEBAR_NESTED_FONT_PX : SIDEBAR_LEAF_FONT_PX,
        }
      : { fontSize: nested ? SIDEBAR_NESTED_FONT_PX : SIDEBAR_LEAF_FONT_PX };

    const content = (
      <>
        {!nested && opts.icon ? (
          <Icon className={cn("h-3.5 w-3.5 shrink-0", SUBMENU_ICON)} strokeWidth={1.5} />
        ) : null}
        <span className="min-w-0 flex-1 whitespace-normal break-words">{label}</span>
        {opts.badge === "demo" ? (
          <span
            className={cn(
              "shrink-0 rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wide",
              active ? "bg-white/20 text-white" : "bg-amber-500/20 text-amber-200/90",
            )}
          >
            Demo
          </span>
        ) : null}
      </>
    );

    if (opts.href) {
      if (isAbsoluteHttpUrl(opts.href)) {
        return (
          <a
            key={key}
            href={opts.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className={className}
            style={style}
          >
            {content}
          </a>
        );
      }
      return (
        <Link
          key={key}
          href={opts.href}
          aria-current={active ? "page" : undefined}
          onClick={onClose}
          className={className}
          style={style}
        >
          {content}
        </Link>
      );
    }

    if (opts.view) {
      return (
        <button
          key={key}
          type="button"
          aria-current={active ? "page" : undefined}
          onClick={() => navigate(opts.view!, opts.query)}
          onPointerEnter={() => onPrefetchView?.(opts.view!)}
          onFocus={() => onPrefetchView?.(opts.view!)}
          className={className}
          style={style}
        >
          {content}
        </button>
      );
    }

    return null;
  }

  /**
   * Parent groups (Clients, Projects, …) render as quiet category labels —
   * not accordion rows or nested cards. Children sit flush underneath via indent.
   */
  function renderGroup(
    item: InternalNavItem | InternalNavChildItem,
    parentKey: string,
    depth: number,
    expandParentsByDefault = false,
  ) {
    const key = `${parentKey}::${item.label}`;
    const hasChildren = (item.children?.length ?? 0) > 0;
    const itemIcon = "icon" in item ? item.icon : undefined;

    if (!hasChildren) {
      return renderLeaf(key, childLabel(item as InternalNavChildItem), isInternalNavChildActive(
        item as InternalNavChildItem,
        activeView,
        pathname,
        basePath,
        searchParams,
      ), {
        view: item.view,
        href: item.href,
        query: "query" in item ? item.query : undefined,
        icon: itemIcon,
        depth,
        badge: item.badge,
      });
    }

    const childActive =
      item.children?.some((child) =>
        isInternalNavChildActive(child, activeView, pathname, basePath, searchParams) ||
        (child.children?.some((nested) =>
          isInternalNavChildActive(nested, activeView, pathname, basePath, searchParams),
        ) ??
          false),
      ) ?? false;
    const autoOpen = childActive || (expandParentsByDefault && depth === 0);
    const isOpen = hydrated ? resolveNavOpen(expanded, collapsedKeys, key, autoOpen) : false;
    const Chevron = isOpen ? ChevronDown : ChevronRight;
    const Icon = resolveIcon(itemIcon);

    return (
      <div key={key} className={depth === 0 ? "pt-0.5 first:pt-0" : undefined}>
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => toggleExpanded(key, isOpen)}
          className={cn(
            "group flex w-full items-center gap-1.5 text-left transition-colors duration-75",
            depth > 0 ? "h-6 pl-6 pr-0.5" : "h-6 pl-1 pr-0.5",
          )}
        >
          {depth === 0 && itemIcon ? (
            <Icon
              className={cn("h-3.5 w-3.5 shrink-0 opacity-70", SUBMENU_ICON)}
              strokeWidth={1.5}
            />
          ) : null}
          <span
            className={cn(
              "min-w-0 flex-1 whitespace-normal break-words text-left leading-[1.25]",
              depth > 0
                ? "font-normal text-white/65 group-hover:text-white/85"
                : "font-medium text-white/72 group-hover:text-white/90",
            )}
            style={{ fontSize: depth > 0 ? SIDEBAR_NESTED_FONT_PX : SIDEBAR_LEAF_FONT_PX }}
          >
            {item.label}
          </span>
          <Chevron
            className="h-2.5 w-2.5 shrink-0 text-white/35 group-hover:text-white/55"
            strokeWidth={1.75}
          />
        </button>
        <div
          className={expandPanelClass(isOpen)}
          style={{ transitionDuration: `${EXPAND_MS}ms` }}
          aria-hidden={!isOpen}
        >
          <div className="min-h-0 overflow-hidden">
            {/* Continuous surface — no nested chrome; hierarchy = indent only */}
            <div>
              {item.children?.map((child) => renderGroup(child, key, depth + 1, expandParentsByDefault))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderPinItem(item: InternalNavItem, accent?: string) {
    const active = isInternalNavItemActive(pathname, item, activeView, basePath, searchParams);
    const Icon = resolveIcon(item.icon);
    const color = accent ?? theme.accent;

    if (!item.view) return null;

    return (
      <div
        key={item.label}
        className="relative rounded-[10px] border"
        style={{
          ...(active
            ? {
                background: `color-mix(in srgb, ${color} 42%, #0B1524)`,
                borderColor: `color-mix(in srgb, ${color} 55%, #243347)`,
              }
            : cardShellStyle(theme)),
          height: overviewEmbed ? OVERVIEW_EMBED_ITEM_H : WORKSPACE_HEADER_H,
          minHeight: overviewEmbed ? OVERVIEW_EMBED_ITEM_H : WORKSPACE_HEADER_H,
          paddingLeft: overviewEmbed ? 5 : CARD_PAD_X,
          paddingRight: 6,
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 rounded-[2px]"
          style={{
            width: 3,
            height: "72%",
            background: color,
            opacity: 1,
          }}
        />
        <button
          type="button"
          aria-current={active ? "page" : undefined}
          onClick={() => navigate(item.view!)}
          onPointerEnter={() => onPrefetchView?.(item.view!)}
          onFocus={() => onPrefetchView?.(item.view!)}
          className={cn(
            "group flex h-full w-full items-center gap-1.5 text-left font-semibold uppercase leading-none transition-colors duration-75",
            overviewEmbed ? "tracking-[0.03em]" : "tracking-[0.08em]",
            active ? "text-white" : "text-white/88 hover:text-white",
          )}
          style={{ fontSize: overviewEmbed ? OVERVIEW_EMBED_FONT_PX : SIDEBAR_MODULE_HEADER_FONT_PX }}
          title={item.label}
        >
          <Icon
            className={cn(
              overviewEmbed ? "h-3 w-3" : "h-3 w-3",
              "shrink-0",
              active ? "text-white" : SUBMENU_ICON,
            )}
            strokeWidth={1.5}
            style={active ? undefined : { color }}
          />
          <span
            className={cn(
              "min-w-0 flex-1 whitespace-normal break-words leading-[1.2] font-semibold uppercase tracking-[0.04em] text-white",
              overviewEmbed && "truncate whitespace-nowrap leading-none tracking-[0.03em]",
            )}
            style={{ fontSize: overviewEmbed ? OVERVIEW_EMBED_FONT_PX : SIDEBAR_MODULE_HEADER_FONT_PX }}
            title={item.label}
          >
            {item.label}
          </span>
        </button>
      </div>
    );
  }

  function renderWorkspace(section: InternalNavSection) {
    const workspaceKey = `workspace::${section.label ?? "workspace"}`;
    const workspaceSectionChildActive = section.items.some((item) => {
      if (item.children?.length) {
        return item.children.some(
          (child) =>
            isInternalNavChildActive(child, activeView, pathname, basePath, searchParams) ||
            (child.children?.some((nested) =>
              isInternalNavChildActive(nested, activeView, pathname, basePath, searchParams),
            ) ??
              false),
        );
      }
      return isInternalNavItemActive(pathname, item, activeView, basePath, searchParams);
    });
    const autoOpen = workspaceSectionChildActive;
    const isOpen = hydrated ? resolveNavOpen(expanded, collapsedKeys, workspaceKey, autoOpen) : false;
    const Icon = resolveIcon(section.icon);
    const color =
      resolveOnwardAirNavAccent(section) ?? section.color ?? theme.accent;
    const Chevron = isOpen ? ChevronDown : ChevronRight;

    return (
      <div
        key={workspaceKey}
        className="relative rounded-[10px] border"
        style={{
          ...cardShellStyle(theme),
          paddingLeft: CARD_PAD_X,
          paddingRight: 6,
          paddingBottom: isOpen ? 4 : 0,
        }}
      >
        {/* Subtle left accent — workspace identity without coloured title text */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 rounded-[2px]"
          style={{
            width: 2,
            height: "70%",
            background: color,
            opacity: 0.85,
          }}
        />
        {/* Compact section header — not a large control */}
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => {
            const willOpen = !isOpen;
            toggleExpanded(workspaceKey, isOpen);
            // Business Productivity landing: open its Dashboard (never File Explorer).
            if (willOpen && section.label === "Business Productivity") {
              const dashboard = section.items.find(
                (item) => item.label === "Dashboard" && item.view,
              );
              if (dashboard?.view) navigate(dashboard.view);
            }
            // Support Desk landing: open Ticket Overview.
            if (willOpen && section.label === "Support Desk") {
              const overview = section.items.find(
                (item) =>
                  (item.label === "Ticket Overview" || item.view === "support-overview") &&
                  item.view,
              );
              if (overview?.view) navigate(overview.view);
            }
            // Operations landing: open Dashboard when present (OnwardAir + future tenants).
            if (willOpen && section.label === "Operations") {
              const dashboard = section.items.find(
                (item) =>
                  (item.label === "Dashboard" || item.view === "operations-dashboard") &&
                  item.view,
              );
              if (dashboard?.view) navigate(dashboard.view);
            }
            // Engineering landing: open Engineering Overview dashboard.
            if (willOpen && section.label === "Engineering") {
              const overview = section.items.find(
                (item) =>
                  (item.label === "Engineering Overview" ||
                    item.view === "oa-engineering-overview") &&
                  item.view,
              );
              if (overview?.view) navigate(overview.view);
            }
            if (willOpen && section.label === "Marketing & Events") {
              const dashboard = section.items.find(
                (item) =>
                  (item.label === "Dashboard" || item.view === "oa-marketing-dashboard") &&
                  item.view,
              );
              if (dashboard?.view) navigate(dashboard.view);
            }
            if (
              willOpen &&
              (section.label === "Fundraising" || section.label === "Fundraising & Cap Table")
            ) {
              const dashboard = section.items.find(
                (item) =>
                  (item.label === "Dashboard" || item.view === "fundraising-dashboard") &&
                  item.view,
              );
              if (dashboard?.view) navigate(dashboard.view);
            }
          }}
          className="group flex w-full items-center gap-1.5 text-left"
          style={{
            height: overviewEmbed ? OVERVIEW_EMBED_ITEM_H : undefined,
            minHeight: overviewEmbed ? OVERVIEW_EMBED_ITEM_H : WORKSPACE_HEADER_H,
            paddingTop: overviewEmbed ? 0 : 4,
            paddingBottom: overviewEmbed ? 0 : 4,
          }}
        >
          <Icon
            className={cn("shrink-0", overviewEmbed ? "h-3 w-3" : "h-3.5 w-3.5")}
            style={{ color, opacity: 0.82 }}
            strokeWidth={1.5}
          />
          <span
            className={cn(
              "min-w-0 flex-1 font-semibold uppercase leading-[1.2] tracking-[0.04em] text-white",
              overviewEmbed
                ? "truncate whitespace-nowrap leading-none tracking-[0.03em]"
                : "whitespace-normal break-words",
            )}
            style={{ fontSize: overviewEmbed ? OVERVIEW_EMBED_FONT_PX : SIDEBAR_MODULE_HEADER_FONT_PX }}
            title={section.label ?? undefined}
          >
            {section.label}
          </span>
          <Chevron
            className={cn(
              "shrink-0 text-white/35 group-hover:text-white/55",
              overviewEmbed ? "h-2 w-2" : "h-2.5 w-2.5",
            )}
            strokeWidth={1.75}
          />
        </button>

        <div
          className={expandPanelClass(isOpen)}
          style={{ transitionDuration: `${EXPAND_MS}ms` }}
          aria-hidden={!isOpen}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="pb-0.5">
              {section.items.map((item) => {
                if (item.children?.length) {
                  return renderGroup(
                    item,
                    workspaceKey,
                    0,
                    Boolean(section.expandChildrenByDefault),
                  );
                }
                const leafActive = isInternalNavItemActive(
                  pathname,
                  item,
                  activeView,
                  basePath,
                  searchParams,
                );
                return renderLeaf(`${workspaceKey}::${item.label}`, item.label, leafActive, {
                  view: item.view,
                  href: item.href,
                  icon: item.icon,
                  depth: 0,
                  badge: item.badge,
                });
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navSections = useMemo(() => {
    const filtered = filterInternalNavSectionsForDemoSurface(
      filterInternalNavSectionsByGrants(
        workspaceNavBase,
        // Hold grants filter until whoami resolves so sections don't vanish then
        // reappear at the bottom of the custom order.
        entitlementsReady ? allowedViews : null,
      ),
      // Host overlays: available on first client paint for customer hosts.
      { allowHostSurfaces: hydrated || customerHostNav },
    );
    const withQaNav = injectTestWorkspaceQaNav(filtered, workspaceSlug);
    if (typeof window !== "undefined" && (hydrated || customerHostNav)) {
      const custom = loadSidebarNavCustom(withQaNav, effectiveWorkspaceSlug);
      return applySidebarSectionOrder(withQaNav, custom);
    }
    return withQaNav;
    // sectionOrderTick forces re-read after Settings saves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedViews, entitlementsReady, hydrated, sectionOrderTick, workspaceNavBase, customerHostNav, effectiveWorkspaceSlug]);

  const pinSections = navSections.filter((section) => section.kind === "pin");
  const showWorkspaceSections =
    entitlementsReady || customerHostNav || Boolean(enabledModules?.length);
  const workspaceSections = showWorkspaceSections
    ? navSections.filter((section) => section.kind === "workspace")
    : [];

  return (
    <aside
      data-ai-target="platform-nav"
      data-overview-embed={overviewEmbed ? "1" : undefined}
      aria-modal={!overviewEmbed && mobileOpen ? true : undefined}
      role={!overviewEmbed && mobileOpen ? "dialog" : undefined}
      aria-label={
        overviewEmbed
          ? "Overview module navigation"
          : mobileOpen
            ? "Navigation menu"
            : undefined
      }
      className={cn(
        overviewEmbed
          ? // Invite: always visible — stacked above the preview on phones, side rail on desktop.
            "oa-overview-nav relative z-auto flex max-h-[min(42vh,280px)] w-full shrink-0 flex-col overflow-hidden border-b pt-0 md:static md:z-auto md:h-full md:min-h-0 md:max-h-full md:w-[220px] md:shrink-0 md:border-b-0 lg:w-[240px] xl:w-[260px] 2xl:w-[280px]"
          : "safe-area-px fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-[min(320px,94vw)] flex-col overflow-hidden pt-[env(safe-area-inset-top)] transition-transform duration-300 ease-out lg:static lg:z-auto lg:h-full lg:max-h-full lg:w-[320px] lg:shrink-0 lg:translate-x-0 lg:pt-0",
        !overviewEmbed && (mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"),
      )}
      style={{
        background: theme.sidebar,
        borderRight: overviewEmbed ? undefined : `1px solid ${theme.border}`,
        borderBottom: overviewEmbed ? `1px solid ${theme.border}` : undefined,
        borderColor: theme.border,
      }}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center",
          overviewEmbed ? "px-2 pt-2 pb-1.5 xl:px-2.5 xl:pt-3 xl:pb-2" : "px-5 pt-5",
        )}
        style={overviewEmbed ? undefined : { paddingBottom: 20 }}
      >
        {overviewEmbed ? (
          <p
            className="w-full max-w-none px-0 text-center font-bold uppercase leading-tight tracking-[0.06em] text-white xl:whitespace-nowrap"
            style={{ fontSize: "clamp(10px, 0.85vw, 13px)" }}
          >
            CLICK BELOW TO VIEW
          </p>
        ) : (
          <WorkspaceSidebarBrand href={basePath} />
        )}
        {overviewEmbed ? null : (
          <button
            type="button"
            className="absolute top-1/2 right-5 flex h-11 w-11 -translate-y-1/2 shrink-0 touch-manipulation items-center justify-center rounded-xl border text-white/55 transition-colors duration-75 hover:text-white lg:hidden"
            style={{ borderColor: theme.cardBorder }}
            aria-label="Close menu"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <nav
        className={cn(
          "sidebar-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain",
          overviewEmbed ? "px-2 pb-2 xl:px-2.5 2xl:px-3" : "px-5",
        )}
      >
        <div className="flex flex-col" style={{ gap: overviewEmbed ? OVERVIEW_EMBED_GAP : CARD_GAP }}>
          {pinSections.map((section) =>
            section.items.map((item) =>
              renderPinItem(item, resolveOnwardAirNavAccent(section) ?? section.color),
            ),
          )}
          {workspaceSections.map((section) => renderWorkspace(section))}
        </div>
      </nav>

      {overviewEmbed ? null : (
        <div
          className="shrink-0 border-t px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          style={{ borderColor: theme.border }}
        >
          <button
            type="button"
            className="flex w-full touch-manipulation items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[11px] font-medium text-white/70 transition-colors duration-75 hover:bg-white/[0.06] hover:text-white"
            onClick={() => {
              void (async () => {
                try {
                  const response = await fetch("/api/auth/logout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      returnTo:
                        typeof window !== "undefined" ? window.location.origin : undefined,
                    }),
                  });
                  const data = (await response.json().catch(() => null)) as {
                    loginUrl?: string;
                  } | null;
                  window.location.assign(data?.loginUrl || "/login");
                } catch {
                  window.location.assign("/login");
                }
              })();
            }}
          >
            <LogOut className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}
