"use client";

import { useId, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Banknote,
  Boxes,
  Briefcase,
  Building2,
  CalendarDays,
  Cable,
  ChartColumn,
  ClipboardCheck,
  ClipboardList,
  Cloud,
  Database,
  FileStack,
  FileText,
  FolderKanban,
  Gauge,
  GitBranch,
  GraduationCap,
  Handshake,
  HardDrive,
  LayoutDashboard,
  Link2,
  Mail,
  MessageSquare,
  Package,
  Plug,
  Scale,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Truck,
  UserCog,
  Users,
  UsersRound,
  Video,
  Wallet,
  Wrench,
} from "lucide-react";

type Capability = {
  label: string;
  icon: LucideIcon;
};

type Workspace = {
  id: string;
  title: string;
  descriptor: string;
  description: string;
  icon: LucideIcon;
  capabilities: Capability[];
  footnote?: string;
};

const WORKSPACES: Workspace[] = [
  {
    id: "business-central",
    title: "Business Central",
    descriptor: "Executive oversight",
    description:
      "Executive oversight, strategic planning, AI-powered decision making and enterprise-wide workflow automation.",
    icon: LayoutDashboard,
    capabilities: [
      { label: "Executive Dashboard", icon: Gauge },
      { label: "Executive AI Assistant", icon: Sparkles },
      { label: "Role-Based Workspaces", icon: Users },
      { label: "Workflow & Approvals", icon: ClipboardCheck },
      { label: "Organisation Dashboard", icon: Building2 },
      { label: "Competitors", icon: Target },
      { label: "Whiteboards", icon: FileStack },
      { label: "Executive Decks", icon: ChartColumn },
      { label: "Strategic Planning", icon: Activity },
    ],
    footnote:
      "Workflow & Approvals supports simple through to highly complex multi-stage approval processes across projects, procurement, HR, finance, contracts, quality management, engineering change requests, expenses, leave requests and any other business workflow.",
  },
  {
    id: "clients-projects",
    title: "Clients & Projects",
    descriptor: "Relationships & delivery",
    description:
      "Manage client relationships, pipeline, onboarding and project delivery in one connected workspace.",
    icon: Briefcase,
    capabilities: [
      { label: "Client Directory", icon: Users },
      { label: "CRM & Pipeline", icon: Handshake },
      { label: "Client Onboarding", icon: ClipboardList },
      { label: "Internal Projects", icon: FolderKanban },
      { label: "External Projects", icon: Briefcase },
      { label: "Quality Management", icon: ShieldCheck },
    ],
  },
  {
    id: "financials",
    title: "Financials",
    descriptor: "Finance & reporting",
    description:
      "Run finance operations, banking connections and reporting from a unified financial command centre.",
    icon: Wallet,
    capabilities: [
      { label: "Financial Dashboard", icon: ChartColumn },
      { label: "General Ledger", icon: FileText },
      { label: "Accounts Receivable", icon: Banknote },
      { label: "Accounts Payable", icon: Wallet },
      { label: "Expenses", icon: ClipboardList },
      { label: "Banking Integration", icon: Building2 },
      { label: "Financial Reporting", icon: Activity },
    ],
  },
  {
    id: "hr-people",
    title: "HR & People",
    descriptor: "Workforce management",
    description:
      "Coordinate workforce management across people, leave, performance, payroll and training.",
    icon: UsersRound,
    capabilities: [
      { label: "HR Dashboard", icon: Gauge },
      { label: "Employees", icon: Users },
      { label: "Leave", icon: CalendarDays },
      { label: "Performance", icon: Target },
      { label: "Recruitment", icon: UserCog },
      { label: "Payroll", icon: Banknote },
      { label: "Training", icon: GraduationCap },
      { label: "Representatives & Distributors", icon: Handshake },
    ],
  },
  {
    id: "engineering",
    title: "Engineering",
    descriptor: "Engineering delivery",
    description:
      "Plan capacity, deliver engineering projects and maintain technical quality and compliance.",
    icon: Wrench,
    capabilities: [
      { label: "Engineering Dashboard", icon: Gauge },
      { label: "Resource Utilisation", icon: Activity },
      { label: "Capacity Planning", icon: ChartColumn },
      { label: "Engineering Projects", icon: FolderKanban },
      { label: "Technical Documentation", icon: FileText },
      { label: "Quality & Compliance", icon: ShieldCheck },
      { label: "Risks & Issues", icon: ClipboardCheck },
    ],
  },
  {
    id: "corporate-operations",
    title: "Corporate Operations",
    descriptor: "Governance & compliance",
    description:
      "Govern company structure, contracts, compliance and advisory relationships from one place.",
    icon: Scale,
    capabilities: [
      { label: "Company Information", icon: Building2 },
      { label: "Cap Table & Shareholder Management", icon: ChartColumn },
      { label: "Software & Licences", icon: HardDrive },
      { label: "Contracts", icon: FileText },
      { label: "Bank Accounts", icon: Banknote },
      { label: "Professional Advisers", icon: Users },
      { label: "Compliance & Governance", icon: ShieldCheck },
    ],
  },
  {
    id: "assets-logistics",
    title: "Assets & Logistics",
    descriptor: "Inventory & procurement",
    description:
      "Track assets, inventory, logistics movements and procurement across your organisation.",
    icon: Package,
    capabilities: [
      { label: "Asset Register", icon: Boxes },
      { label: "Inventory", icon: Package },
      { label: "Logistics", icon: Truck },
      { label: "Procurement", icon: ClipboardList },
    ],
  },
  {
    id: "productivity",
    title: "Productivity & Collaboration",
    descriptor: "Communication & knowledge",
    description:
      "Centralise communication, knowledge, calendar and support across your organisation.",
    icon: MessageSquare,
    capabilities: [
      { label: "Information Repository", icon: Database },
      { label: "Email", icon: Mail },
      { label: "Calendar", icon: CalendarDays },
      { label: "Messaging", icon: MessageSquare },
      { label: "Voice & Video", icon: Video },
      { label: "Social", icon: Share2 },
      { label: "Support Desk / WhatsApp", icon: Cable },
    ],
  },
  {
    id: "integrations",
    title: "Business Integrations",
    descriptor: "Connect your existing systems",
    description:
      "Connect Unit311 Central to the specialist systems your business already relies on—integrate rather than replace.",
    icon: Plug,
    capabilities: [
      { label: "Microsoft 365", icon: Cloud },
      { label: "Outlook", icon: Mail },
      { label: "Teams", icon: MessageSquare },
      { label: "SharePoint", icon: FileStack },
      { label: "OneDrive", icon: HardDrive },
      { label: "Power BI", icon: ChartColumn },
      { label: "Dynamics 365", icon: Building2 },
      { label: "SAP", icon: Database },
      { label: "Oracle", icon: Database },
      { label: "Xero", icon: Wallet },
      { label: "Sage", icon: Wallet },
      { label: "QuickBooks", icon: Wallet },
      { label: "Salesforce", icon: Target },
      { label: "HubSpot", icon: Handshake },
      { label: "Jira", icon: ClipboardCheck },
      { label: "GitHub", icon: GitBranch },
      { label: "Monday.com", icon: LayoutDashboard },
      { label: "Asana", icon: FolderKanban },
      { label: "Google Workspace", icon: Cloud },
      { label: "Dropbox", icon: HardDrive },
      { label: "REST APIs", icon: Link2 },
      { label: "Webhooks", icon: Cable },
      { label: "Custom Integrations", icon: Plug },
    ],
    footnote:
      "Unit311 Central is designed to integrate with the business systems you already use, connecting data and workflows without forcing a rip-and-replace approach.",
  },
];

function CapabilityChip({ label, icon: Icon }: Capability) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm transition-colors duration-200 sm:gap-2 sm:px-3.5 sm:py-2 sm:text-[13px]">
      <Icon className="h-3.5 w-3.5 shrink-0 text-sky-400/80 sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />
      {label}
    </span>
  );
}

function ExpandedPanel({
  panelId,
  workspace,
}: {
  panelId: string;
  workspace: Workspace | null;
}) {
  const Icon = workspace?.icon;

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={workspace ? `${panelId}-${workspace.id}` : undefined}
      aria-hidden={!workspace}
      className={[
        "rounded-2xl border border-white/[0.1] bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-opacity duration-300 sm:rounded-[24px] sm:p-7 lg:p-8",
        workspace ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
    >
      {workspace && Icon ? (
        <>
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-400/12 text-sky-300 sm:h-12 sm:w-12">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl lg:text-[22px]">
                {workspace.title}
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/60 sm:text-[15px] lg:text-[16px]">
                {workspace.description}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 sm:mt-6 sm:gap-2.5">
            {workspace.capabilities.map((capability) => (
              <CapabilityChip key={capability.label} {...capability} />
            ))}
          </div>

          {workspace.footnote ? (
            <p className="mt-5 max-w-4xl text-[13px] leading-relaxed text-white/48 sm:mt-6 sm:text-sm">
              {workspace.footnote}
            </p>
          ) : null}
        </>
      ) : (
        <div className="h-24" aria-hidden />
      )}
    </div>
  );
}

export default function HomeWorkspaceExplorer() {
  const [openId, setOpenId] = useState<string | null>(null);
  const panelId = useId();
  const openWorkspace = WORKSPACES.find((workspace) => workspace.id === openId) ?? null;

  function toggleWorkspace(id: string) {
    setOpenId((current) => (current === id ? null : id));
  }

  return (
    <div
      className="relative mt-10 sm:mt-14 lg:mt-16"
      onKeyDown={(event) => {
        if (event.key === "Escape" && openId) {
          setOpenId(null);
        }
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-8 h-[min(420px,70%)] rounded-[40px] opacity-80"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(59,130,246,0.1) 0%, rgba(56,189,248,0.04) 45%, transparent 75%)",
        }}
      />

      <div className="relative -mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:thin] sm:mx-0 sm:px-0 lg:overflow-visible">
        <div
          role="tablist"
          aria-label="Unit311 Central workspaces"
          className="flex min-w-max gap-2 sm:gap-2.5 lg:min-w-0 lg:w-full lg:gap-2.5 xl:gap-3"
        >
          {WORKSPACES.map((workspace) => {
            const Icon = workspace.icon;
            const isOpen = openId === workspace.id;

            return (
              <button
                key={workspace.id}
                type="button"
                role="tab"
                aria-selected={isOpen}
                aria-expanded={isOpen}
                aria-controls={panelId}
                id={`${panelId}-${workspace.id}`}
                onClick={() => toggleWorkspace(workspace.id)}
                className={[
                  "group relative flex min-h-[124px] w-[126px] shrink-0 flex-col items-start rounded-2xl border p-3 text-left backdrop-blur-md transition-all duration-300 ease-out",
                  "sm:min-h-[136px] sm:w-[138px] sm:rounded-[18px] sm:p-3.5",
                  "lg:min-h-[148px] lg:w-auto lg:min-w-0 lg:flex-1 lg:rounded-[18px] lg:p-3",
                  "xl:min-h-[156px] xl:rounded-[20px] xl:p-4",
                  "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]",
                  isOpen
                    ? "border-sky-400/35 bg-gradient-to-b from-white/[0.12] to-white/[0.05] shadow-[0_16px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "border-white/[0.08] bg-gradient-to-b from-white/[0.08] to-white/[0.025] shadow-[0_10px_28px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-sky-400/25 hover:bg-white/[0.07]",
                ].join(" ")}
              >
                <span
                  className={[
                    "mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl border transition-colors duration-300 sm:mb-3 sm:h-9 sm:w-9",
                    isOpen
                      ? "border-sky-400/30 bg-sky-400/15 text-sky-300"
                      : "border-white/10 bg-white/[0.04] text-sky-400/85 group-hover:border-sky-400/25 group-hover:bg-sky-400/10",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4 sm:h-[17px] sm:w-[17px]" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="text-[11px] font-semibold leading-snug tracking-tight text-white sm:text-[12px] lg:text-[11.5px] xl:text-[12.5px] 2xl:text-[13px]">
                  {workspace.title}
                </span>
                <span className="mt-1 text-[10px] leading-snug text-white/45 sm:text-[11px] lg:text-[10.5px] xl:text-[11.5px]">
                  {workspace.descriptor}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={[
          "grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          openWorkspace ? "mt-4 grid-rows-[1fr] sm:mt-5" : "mt-0 grid-rows-[0fr]",
        ].join(" ")}
      >
        <div className="min-h-0 overflow-hidden">
          <ExpandedPanel
            panelId={panelId}
            workspace={openWorkspace}
          />
        </div>
      </div>
    </div>
  );
}
