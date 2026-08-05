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
import { isInternalDomainHost } from "@/lib/app-domains";
import { isAbsoluteHttpUrl } from "@/lib/clarity";
import {
  resolveOnwardAirNavAccent,
} from "@/lib/onwardair-surface";
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

const WORKSPACE_HEADER_H = 36;
const CARD_PAD_X = 8;
const CARD_GAP = 10;

type EnterprisePlatformSidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
  activeView?: InternalOperationsView;
  onViewChange?: (view: InternalOperationsView) => void;
  basePath?: SurveyOperationsBasePath;
  onPrefetchView?: (view: InternalOperationsView) => void;
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

export default function EnterprisePlatformSidebar({
  mobileOpen = false,
  onClose,
  activeView = "home",
  onViewChange,
  basePath = "/internaldashboard",
  onPrefetchView,
}: EnterprisePlatformSidebarProps) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [theme, setTheme] = useState<SidebarThemeTokens>(() => getSidebarTheme(readSidebarThemeId()));
  const [hydrated, setHydrated] = useState(false);
  const [sectionOrderTick, setSectionOrderTick] = useState(0);

  const [isInternalOpsHost] = useState(() => {
    if (basePath === "/dashboard") return false;
    if (typeof window !== "undefined" && isInternalDomainHost(window.location.hostname)) {
      return true;
    }
    return basePath === "/" || basePath === "/internaldashboard" || basePath === "/internaldashboard_grants";
  });

  useEffect(() => {
    const saved = readSidebarExpandedState();
    startTransition(() => {
      setExpanded(saved);
      setTheme(getSidebarTheme(readSidebarThemeId()));
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    const onCustom = () => setSectionOrderTick((n) => n + 1);
    window.addEventListener(SIDEBAR_NAV_CUSTOM_EVENT, onCustom);
    window.addEventListener("storage", onCustom);
    return () => {
      window.removeEventListener(SIDEBAR_NAV_CUSTOM_EVENT, onCustom);
      window.removeEventListener("storage", onCustom);
    };
  }, []);

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

  function toggleExpanded(key: string) {
    setExpanded((current) => {
      const next = { ...current, [key]: !current[key] };
      writeSidebarExpandedState(next);
      return next;
    });
  }

  function navigate(view: InternalOperationsView) {
    onViewChange?.(view);
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
            "h-6 gap-0 rounded-md py-0 pl-6 pr-1 text-[11px] font-normal leading-[1.2]",
            NESTED_TEXT,
          )
        : "h-[26px] gap-1.5 rounded-md py-0 pl-1 pr-1 text-[12px] font-medium leading-[1.2] text-white/88",
      active
        ? "text-white"
        : nested
          ? "hover:bg-white/[0.04] hover:text-white"
          : "hover:bg-white/[0.04] hover:text-white",
    );
    const style = active ? { background: "#1F4FBF", color: "#FFFFFF" } : undefined;

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
          onClick={() => navigate(opts.view!)}
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
        icon: itemIcon,
        depth,
        badge: item.badge,
      });
    }

    const isOpen = hydrated ? Boolean(expanded[key]) : false;
    const Chevron = isOpen ? ChevronDown : ChevronRight;
    const Icon = resolveIcon(itemIcon);

    return (
      <div key={key} className={depth === 0 ? "pt-0.5 first:pt-0" : undefined}>
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => toggleExpanded(key)}
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
              "min-w-0 flex-1 whitespace-normal break-words text-left leading-[1.2]",
              depth > 0
                ? "text-[11px] font-normal text-white/65 group-hover:text-white/85"
                : "text-[12px] font-medium text-white/72 group-hover:text-white/90",
            )}
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
              {item.children?.map((child) => renderGroup(child, key, depth + 1))}
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
          height: WORKSPACE_HEADER_H,
          paddingLeft: CARD_PAD_X,
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
            "group flex h-full w-full items-center gap-1.5 text-left font-semibold uppercase leading-none tracking-[0.08em] transition-colors duration-75",
            active ? "text-white" : "text-white/88 hover:text-white",
          )}
          style={{ fontSize: 10.5 }}
        >
          <Icon
            className={cn("h-3.5 w-3.5 shrink-0", active ? "text-white" : SUBMENU_ICON)}
            strokeWidth={1.5}
            style={active ? undefined : { color }}
          />
          <span className="min-w-0 flex-1 truncate whitespace-nowrap">{item.label}</span>
        </button>
      </div>
    );
  }

  function renderWorkspace(section: InternalNavSection) {
    const workspaceKey = `workspace::${section.label ?? "workspace"}`;
    const isOpen = hydrated ? Boolean(expanded[workspaceKey]) : false;
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
            const willOpen = !(hydrated && expanded[workspaceKey]);
            toggleExpanded(workspaceKey);
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
          style={{ height: WORKSPACE_HEADER_H }}
        >
          <Icon
            className="h-3.5 w-3.5 shrink-0"
            style={{ color, opacity: 0.82 }}
            strokeWidth={1.5}
          />
          <span
            className="min-w-0 flex-1 truncate whitespace-nowrap font-semibold uppercase leading-none tracking-[0.08em] text-white"
            style={{ fontSize: 10.5 }}
          >
            {section.label}
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
            <div className="pb-0.5">
              {section.items.map((item) => {
                if (item.children?.length) {
                  return renderGroup(item, workspaceKey, 0);
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

  const { allowedViews } = useOperatorEntitlements();
  const navSections = useMemo(() => {
    const filtered = filterInternalNavSectionsForDemoSurface(
      filterInternalNavSectionsByGrants(internalSurveyNavSections, allowedViews),
      // Host overlays (OA / ABHI / Talanton) only after mount — matches SSR HTML.
      { allowHostSurfaces: hydrated },
    );
    if (!hydrated) return filtered;
    const custom = loadSidebarNavCustom(filtered);
    return applySidebarSectionOrder(filtered, custom.sectionOrder);
    // sectionOrderTick forces re-read after Settings saves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedViews, hydrated, sectionOrderTick]);

  const pinSections = navSections.filter((section) => section.kind === "pin");
  const workspaceSections = navSections.filter((section) => section.kind === "workspace");

  return (
    <aside
      data-ai-target="platform-nav"
      aria-modal={mobileOpen ? true : undefined}
      role={mobileOpen ? "dialog" : undefined}
      aria-label={mobileOpen ? "Navigation menu" : undefined}
      className={cn(
        "safe-area-px fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-[min(320px,94vw)] flex-col overflow-hidden pt-[env(safe-area-inset-top)] transition-transform duration-300 ease-out lg:static lg:z-auto lg:h-full lg:max-h-full lg:w-[320px] lg:shrink-0 lg:translate-x-0 lg:pt-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
      style={{
        background: theme.sidebar,
        borderRight: `1px solid ${theme.border}`,
      }}
    >
      <div
        className="relative flex shrink-0 items-center justify-center px-5 pt-5"
        style={{ paddingBottom: 20 }}
      >
        <WorkspaceSidebarBrand href={basePath} />
        <button
          type="button"
          className="absolute top-1/2 right-5 flex h-11 w-11 -translate-y-1/2 shrink-0 touch-manipulation items-center justify-center rounded-xl border text-white/55 transition-colors duration-75 hover:text-white lg:hidden"
          style={{ borderColor: theme.cardBorder }}
          aria-label="Close menu"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>

      <nav className="sidebar-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-5">
        <div className="flex flex-col" style={{ gap: CARD_GAP }}>
          {pinSections.map((section) =>
            section.items.map((item) =>
              renderPinItem(item, resolveOnwardAirNavAccent(section) ?? section.color),
            ),
          )}
          {workspaceSections.map((section) => renderWorkspace(section))}
        </div>
      </nav>

      <div
        className="shrink-0 border-t px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        style={{ borderColor: theme.border }}
      >
        <button
          type="button"
          className="flex w-full touch-manipulation items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[13px] font-medium text-white/70 transition-colors duration-75 hover:bg-white/[0.06] hover:text-white"
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
    </aside>
  );
}
