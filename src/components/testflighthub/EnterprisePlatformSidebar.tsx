"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ContactRound,
  FlaskConical,
  FolderKanban,
  FolderOpen,
  Globe,
  GraduationCap,
  Handshake,
  KeyRound,
  Landmark,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  MessageSquare,
  Package,
  Radio,
  Receipt,
  ScrollText,
  Settings,
  Share2,
  ShieldCheck,
  Target,
  Truck,
  Users,
  Video,
  Wallet,
  Wrench,
  X,
} from "lucide-react";

import Unit311CentralWordmark from "@/components/layout/Unit311CentralWordmark";
import {
  getInternalNavHref,
  internalSurveyNavSections,
  isInternalNavChildActive,
  isInternalNavItemActive,
  type InternalNavChildItem,
  type InternalNavItem,
  type InternalNavSection,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import { isInternalDomainHost } from "@/lib/app-domains";
import {
  getSidebarTheme,
  readSidebarExpandedState,
  readSidebarThemeId,
  writeSidebarExpandedState,
  type SidebarThemeTokens,
} from "@/lib/sidebar-chrome";
import type { SurveyOperationsBasePath } from "@/lib/survey-operations-mock-data";
import { cn } from "@/lib/utils";

const iconMap = {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ContactRound,
  FlaskConical,
  FolderKanban,
  FolderOpen,
  Globe,
  GraduationCap,
  Handshake,
  KeyRound,
  Landmark,
  Layers,
  LifeBuoy,
  Mail,
  MessageSquare,
  Package,
  Radio,
  Receipt,
  ScrollText,
  Settings,
  Share2,
  ShieldCheck,
  Target,
  Truck,
  Users,
  Video,
  Wallet,
  Wrench,
} as const;

type EnterprisePlatformSidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
  activeView?: InternalOperationsView;
  onViewChange?: (view: InternalOperationsView) => void;
  basePath?: SurveyOperationsBasePath;
  onPrefetchView?: (view: InternalOperationsView) => void;
};

function sectionHasActiveItem(
  section: InternalNavSection,
  activeView: InternalOperationsView,
  pathname: string,
  basePath: SurveyOperationsBasePath,
  searchParams: URLSearchParams | null,
) {
  return section.items.some((item) =>
    isInternalNavItemActive(pathname, item, activeView, basePath, searchParams),
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

  const [isInternalOpsHost] = useState(() => {
    if (basePath === "/dashboard") return false;
    if (typeof window !== "undefined" && isInternalDomainHost(window.location.hostname)) {
      return true;
    }
    return basePath === "/" || basePath === "/internaldashboard" || basePath === "/internaldashboard_grants";
  });

  useEffect(() => {
    const saved = readSidebarExpandedState();
    const auto: Record<string, boolean> = {};
    internalSurveyNavSections.forEach((section) => {
      if (section.kind === "workspace" && section.label) {
        const workspaceKey = `workspace::${section.label}`;
        if (sectionHasActiveItem(section, activeView, pathname, basePath, searchParams)) {
          auto[workspaceKey] = true;
        }
        section.items.forEach((item) => {
          if (
            item.children?.some((child) =>
              isInternalNavChildActive(child, activeView, pathname, basePath, searchParams),
            )
          ) {
            auto[`${workspaceKey}::${item.label}`] = true;
            item.children?.forEach((child) => {
              if (
                child.children?.some((nested) =>
                  isInternalNavChildActive(nested, activeView, pathname, basePath, searchParams),
                )
              ) {
                auto[`${workspaceKey}::${item.label}::${child.label}`] = true;
              }
            });
          }
        });
      }
    });
    startTransition(() => {
      setExpanded({ ...saved, ...auto });
      setTheme(getSidebarTheme(readSidebarThemeId()));
      setHydrated(true);
    });
  }, [activeView, pathname, searchParams, basePath]);

  useEffect(() => {
    const onTheme = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setTheme(getSidebarTheme(detail));
    };
    window.addEventListener("unit311-sidebar-theme", onTheme);
    return () => window.removeEventListener("unit311-sidebar-theme", onTheme);
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

  function renderLeaf(
    key: string,
    label: string,
    active: boolean,
    opts: {
      view?: InternalOperationsView;
      href?: string;
      nested?: boolean;
      bullet?: boolean;
    },
  ) {
    const className = cn(
      "flex w-full items-center rounded-[10px] text-left text-[13px] font-medium transition-colors duration-200",
      opts.nested ? "min-h-9 py-2 pl-8 pr-3" : "min-h-10 gap-3 py-2.5 pl-3 pr-3",
      active ? "text-white" : "text-white/70 hover:bg-white/[0.04] hover:text-white/90",
    );
    const style = active
      ? { background: "#1F4FBF" }
      : undefined;

    const content = (
      <>
        {opts.bullet ? (
          <span className="mr-3 h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" aria-hidden />
        ) : null}
        <span className="truncate">{label}</span>
      </>
    );

    if (opts.href) {
      return (
        <Link key={key} href={opts.href} aria-current={active ? "page" : undefined} onClick={onClose} className={className} style={style}>
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

  function renderGroup(
    item: InternalNavItem | InternalNavChildItem,
    parentKey: string,
    depth: number,
  ) {
    const key = `${parentKey}::${item.label}`;
    const hasChildren = (item.children?.length ?? 0) > 0;
    const active = isInternalNavChildActive(
      item as InternalNavChildItem,
      activeView,
      pathname,
      basePath,
      searchParams,
    );

    if (!hasChildren) {
      return renderLeaf(key, childLabel(item as InternalNavChildItem), active, {
        view: item.view,
        href: item.href,
        nested: depth > 0,
        bullet: depth > 0,
      });
    }

    const isOpen = hydrated ? Boolean(expanded[key]) : false;
    const Chevron = isOpen ? ChevronDown : ChevronRight;

    return (
      <div key={key}>
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => toggleExpanded(key)}
          className={cn(
            "flex w-full items-center justify-between rounded-[10px] py-2.5 text-left text-[13px] font-medium text-white/80 transition-colors duration-200 hover:bg-white/[0.04] hover:text-white",
            depth > 0 ? "pl-3 pr-2" : "pl-3 pr-2",
          )}
        >
          <span className="truncate">{item.label}</span>
          <Chevron className="h-[18px] w-[18px] shrink-0 text-white/35" strokeWidth={1.75} />
        </button>
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
            isOpen ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0",
          )}
          aria-hidden={!isOpen}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="mt-1 space-y-1">
              {item.children?.map((child) => renderGroup(child, key, depth + 1))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderPinItem(item: InternalNavItem) {
    const active = isInternalNavItemActive(pathname, item, activeView, basePath, searchParams);
    const Icon = iconMap[item.icon as keyof typeof iconMap] ?? LayoutDashboard;
    const className = cn(
      "flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-left text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors duration-200",
      active ? "text-white" : "text-white/75 hover:bg-white/[0.04] hover:text-white",
    );
    const style = active ? { background: "#1F4FBF" } : undefined;

    if (item.view) {
      return (
        <button
          key={item.label}
          type="button"
          aria-current={active ? "page" : undefined}
          onClick={() => navigate(item.view!)}
          onPointerEnter={() => onPrefetchView?.(item.view!)}
          onFocus={() => onPrefetchView?.(item.view!)}
          className={className}
          style={style}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
          <span className="truncate">{item.label}</span>
        </button>
      );
    }

    return null;
  }

  function renderWorkspace(section: InternalNavSection) {
    const workspaceKey = `workspace::${section.label ?? "workspace"}`;
    const isOpen = hydrated ? Boolean(expanded[workspaceKey]) : false;
    const Icon = iconMap[(section.icon ?? "Layers") as keyof typeof iconMap] ?? Layers;
    const color = section.color ?? theme.accent;
    const Chevron = isOpen ? ChevronDown : ChevronRight;

    return (
      <div
        key={workspaceKey}
        className="rounded-[14px] border p-[18px]"
        style={{
          background: theme.card,
          borderColor: theme.cardBorder,
          boxShadow: "0 1px 0 rgba(255,255,255,0.02)",
        }}
      >
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => toggleExpanded(workspaceKey)}
          className="flex w-full items-center gap-3 text-left"
        >
          <Icon className="h-[18px] w-[18px] shrink-0" style={{ color }} strokeWidth={1.75} />
          <span
            className="min-w-0 flex-1 truncate text-[13px] font-semibold uppercase tracking-[0.08em]"
            style={{ color }}
          >
            {section.label}
          </span>
          <Chevron className="h-[18px] w-[18px] shrink-0 text-white/35" strokeWidth={1.75} />
        </button>

        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
            isOpen ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0",
          )}
          aria-hidden={!isOpen}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="mt-2 space-y-1">
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
                });
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pinSections = internalSurveyNavSections.filter((section) => section.kind === "pin");
  const workspaceSections = internalSurveyNavSections.filter((section) => section.kind === "workspace");

  return (
    <aside
      data-ai-target="platform-nav"
      aria-modal={mobileOpen ? true : undefined}
      role={mobileOpen ? "dialog" : undefined}
      aria-label={mobileOpen ? "Navigation menu" : undefined}
      className={cn(
        "safe-area-px fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-[min(300px,92vw)] flex-col overflow-hidden pt-[env(safe-area-inset-top)] transition-transform duration-300 ease-out lg:static lg:z-auto lg:h-full lg:max-h-full lg:w-[300px] lg:shrink-0 lg:translate-x-0 lg:pt-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
      style={{
        background: theme.sidebar,
        borderRight: `1px solid ${theme.border}`,
      }}
    >
      <div className="flex shrink-0 items-center justify-between px-6 pb-5 pt-6">
        <Link
          href={basePath}
          aria-label="Unit311 Central home"
          className="inline-flex shrink-0 transition-opacity duration-200 hover:opacity-90"
        >
          <Unit311CentralWordmark variant="sidebar" />
        </Link>
        <button
          type="button"
          className="ml-2 flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-[10px] border text-white/55 transition-colors duration-200 hover:text-white lg:hidden"
          style={{ borderColor: theme.cardBorder }}
          aria-label="Close menu"
          onClick={onClose}
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <nav className="sidebar-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="space-y-2">
          {pinSections.map((section) =>
            section.items.map((item) => renderPinItem(item)),
          )}
        </div>

        <div className="mt-4 space-y-4">
          {workspaceSections.map((section) => renderWorkspace(section))}
        </div>
      </nav>
    </aside>
  );
}
