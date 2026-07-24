"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Bot,
  Boxes,
  Briefcase,
  Building2,
  Cloud,
  Code2,
  Cpu,
  Database,
  FolderKanban,
  Gauge,
  GraduationCap,
  Handshake,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Package,
  Plug,
  Scale,
  ShieldCheck,
  Target,
  Truck,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";

type Capability = {
  label: string;
  detail: string;
  icon: LucideIcon;
};

type FeaturedCapabilities = [Capability, Capability, Capability, Capability];

type Workspace = {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  accentRgb: string;
  icon: LucideIcon;
  featuredCapabilities: FeaturedCapabilities;
  additionalCapabilityCount: number;
  screenshot: ReactNode;
};

function ShotShell({
  title,
  accentRgb,
  children,
}: {
  title: string;
  accentRgb: string;
  children: ReactNode;
}) {
  return (
    <div
      className="workspace-shot relative h-full w-full overflow-hidden rounded-[18px] border border-white/12 bg-[#070b14]"
      style={{ "--ws-accent-rgb": accentRgb } as CSSProperties}
    >
      <div className="flex h-9 items-center gap-2 border-b border-white/10 bg-[#0b1220] px-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]/80" />
        </span>
        <span className="ml-2 truncate text-[11px] font-medium text-white/45">{title}</span>
      </div>
      <div className="grid h-[calc(100%-2.25rem)] grid-cols-[52px_minmax(0,1fr)]">
        <div className="border-r border-white/8 bg-[#080e1a] px-1.5 py-2">
          <div className="mx-auto mb-2 h-7 w-7 rounded-lg bg-[rgba(var(--ws-accent-rgb),0.22)]" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="mx-auto mb-1.5 h-6 w-6 rounded-md bg-white/[0.04]"
              style={i === 0 ? { background: `rgba(${accentRgb}, 0.28)` } : undefined}
            />
          ))}
        </div>
        <div className="min-h-0 overflow-hidden bg-[linear-gradient(180deg,#0a1220_0%,#070b14_100%)] p-3 sm:p-3.5">
          {children}
        </div>
      </div>
    </div>
  );
}

function KpiRow({ items, accentRgb }: { items: string[]; accentRgb: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item, index) => (
        <div
          key={item}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2"
          style={
            index === 0
              ? { borderColor: `rgba(${accentRgb}, 0.35)`, background: `rgba(${accentRgb}, 0.08)` }
              : undefined
          }
        >
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">{item}</p>
          <p className="mt-1 text-[15px] font-semibold text-white/90">
            {index === 0 ? "94%" : index === 1 ? "128" : "12"}
          </p>
        </div>
      ))}
    </div>
  );
}

function ListRows({ rows, accentRgb }: { rows: string[]; accentRgb: string }) {
  return (
    <div className="mt-2.5 space-y-1.5">
      {rows.map((row, index) => (
        <div
          key={row}
          className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.025] px-2.5 py-1.5"
        >
          <span className="truncate text-[11px] text-white/70">{row}</span>
          <span
            className="ml-2 h-1.5 w-10 rounded-full"
            style={{ background: `rgba(${accentRgb}, ${index === 0 ? 0.7 : 0.28})` }}
          />
        </div>
      ))}
    </div>
  );
}

function makeShot(title: string, accentRgb: string, kpis: string[], rows: string[]) {
  return (
    <ShotShell title={title} accentRgb={accentRgb}>
      <KpiRow items={kpis} accentRgb={accentRgb} />
      <ListRows rows={rows} accentRgb={accentRgb} />
    </ShotShell>
  );
}

const WORKSPACES: Workspace[] = [
  {
    id: "business-central",
    title: "Business Central",
    shortTitle: "Central",
    subtitle: "Executive oversight",
    description:
      "Executive oversight and enterprise-wide business management, including Quality Management (QMS).",
    accentRgb: "59, 130, 246",
    icon: LayoutDashboard,
    featuredCapabilities: [
      { label: "Executive Dashboard", detail: "Live KPIs and strategic reporting.", icon: Gauge },
      { label: "Quality Management", detail: "Embed QMS controls into operating workflows.", icon: ShieldCheck },
      { label: "Strategic Planning", detail: "Keep priorities and ownership visible.", icon: Target },
      { label: "Enterprise Oversight", detail: "One connected operating picture.", icon: LayoutDashboard },
    ],
    additionalCapabilityCount: 0,
    screenshot: (
      <ShotShell title="Business Central · Executive Dashboard" accentRgb="59, 130, 246">
        <KpiRow items={["Health", "QMS", "At risk"]} accentRgb="59, 130, 246" />
        <ListRows
          rows={["Board pack review", "QMS actions", "Enterprise renewals", "Capacity planning"]}
          accentRgb="59, 130, 246"
        />
      </ShotShell>
    ),
  },
  {
    id: "ai-executive-assistant",
    title: "AI Executive Assistant",
    shortTitle: "Assistant",
    subtitle: "AI insights",
    description: "AI assistant, executive insights and business intelligence across the operating platform.",
    accentRgb: "244, 114, 182",
    icon: Bot,
    featuredCapabilities: [
      { label: "AI Assistant", detail: "Ask questions and take action across business data.", icon: Bot },
      { label: "Executive Insights", detail: "Surface what needs attention early.", icon: Gauge },
      { label: "Business Intelligence", detail: "Turn live signals into decision support.", icon: Target },
      { label: "Operating Briefings", detail: "Keep leadership aligned with current summaries.", icon: MessageSquare },
    ],
    additionalCapabilityCount: 0,
    screenshot: (
      <ShotShell title="AI Executive Assistant · Insights" accentRgb="244, 114, 182">
        <KpiRow items={["Alerts", "Actions", "Briefs"]} accentRgb="244, 114, 182" />
        <ListRows
          rows={["Cash watch", "Delivery risk", "People coverage", "Renewal pack"]}
          accentRgb="244, 114, 182"
        />
      </ShotShell>
    ),
  },
  {
    id: "clients-projects",
    title: "Clients & Projects",
    shortTitle: "Clients",
    subtitle: "CRM, sales and delivery",
    description: "CRM, sales, projects and delivery in one connected workspace.",
    accentRgb: "20, 184, 166",
    icon: Briefcase,
    featuredCapabilities: [
      { label: "CRM", detail: "Qualify demand with clear stage ownership.", icon: Handshake },
      { label: "Sales", detail: "Move commercial work from pipeline through close.", icon: Target },
      { label: "Projects", detail: "Plan and track delivery across the portfolio.", icon: FolderKanban },
      { label: "Delivery", detail: "Keep account and delivery teams aligned.", icon: Briefcase },
    ],
    additionalCapabilityCount: 0,
    screenshot: (
      <ShotShell title="Clients & Projects · Pipeline" accentRgb="20, 184, 166">
        <KpiRow items={["Active", "Won", "Delivery"]} accentRgb="20, 184, 166" />
        <ListRows
          rows={["Northwind renewal", "Helios discovery", "Atlas onboarding", "Orbit delivery"]}
          accentRgb="20, 184, 166"
        />
      </ShotShell>
    ),
  },
  {
    id: "financials",
    title: "Financials",
    shortTitle: "Finance",
    subtitle: "Finance and reporting",
    description: "Finance, reporting and budgeting from a unified financial command centre.",
    accentRgb: "16, 185, 129",
    icon: Wallet,
    featuredCapabilities: [
      { label: "Finance", detail: "Run day-to-day finance operations in one place.", icon: Wallet },
      { label: "Reporting", detail: "Produce board-ready financial reporting faster.", icon: Banknote },
      { label: "Budgeting", detail: "Plan and track budgets against live signals.", icon: Gauge },
      { label: "Cash Visibility", detail: "Keep runway and obligations in one picture.", icon: Gauge },
    ],
    additionalCapabilityCount: 0,
    screenshot: (
      <ShotShell title="Financials · Cash & Reporting" accentRgb="16, 185, 129">
        <KpiRow items={["Cash", "AR", "AP"]} accentRgb="16, 185, 129" />
        <ListRows
          rows={["Treasury summary", "Open invoices", "Supplier approvals", "Monthly close"]}
          accentRgb="16, 185, 129"
        />
      </ShotShell>
    ),
  },
  {
    id: "hr-people",
    title: "HR & People",
    shortTitle: "People",
    subtitle: "Workforce management",
    description: "HR, recruitment, training, performance and workforce operations.",
    accentRgb: "168, 85, 247",
    icon: UsersRound,
    featuredCapabilities: [
      { label: "HR", detail: "Maintain employee records and structure.", icon: Users },
      { label: "Recruitment", detail: "Run hiring from requisition through offer.", icon: UsersRound },
      { label: "Training", detail: "Keep workforce skills current.", icon: GraduationCap },
      { label: "Performance", detail: "Track goals, reviews and development.", icon: Target },
    ],
    additionalCapabilityCount: 1,
    screenshot: (
      <ShotShell title="HR & People · Workforce" accentRgb="168, 85, 247">
        <KpiRow items={["Headcount", "Leave", "Training"]} accentRgb="168, 85, 247" />
        <ListRows
          rows={["Open requisitions", "Leave requests", "Review cycle", "Mandatory training"]}
          accentRgb="168, 85, 247"
        />
      </ShotShell>
    ),
  },
  {
    id: "technology-engineering",
    title: "Technology & Engineering",
    shortTitle: "Technology",
    subtitle: "Technology estate and engineering",
    description:
      "Devices, software, telecommunications, infrastructure, cloud, networks, engineering, APIs, development and DevOps.",
    accentRgb: "56, 189, 248",
    icon: Cpu,
    featuredCapabilities: [
      { label: "Devices and Software", detail: "Track hardware, licences and the estate.", icon: HardDrive },
      { label: "Infrastructure and Cloud", detail: "Operate platforms, networks and cloud.", icon: Cloud },
      { label: "Engineering", detail: "Coordinate engineering inside technology.", icon: Code2 },
      { label: "APIs and DevOps", detail: "Connect development and operating workflows.", icon: KeyRound },
    ],
    additionalCapabilityCount: 6,
    screenshot: (
      <ShotShell title="Technology & Engineering · Estate" accentRgb="56, 189, 248">
        <KpiRow items={["Devices", "Cloud", "APIs"]} accentRgb="56, 189, 248" />
        <ListRows
          rows={["Laptop fleet", "SaaS renewals", "Release train", "Identity reviews"]}
          accentRgb="56, 189, 248"
        />
      </ShotShell>
    ),
  },
  {
    id: "corporate",
    title: "Corporate",
    shortTitle: "Corporate",
    subtitle: "Governance and compliance",
    description: "Governance, compliance, risk, legal and policies.",
    accentRgb: "148, 163, 184",
    icon: Scale,
    featuredCapabilities: [
      { label: "Governance", detail: "Keep corporate structure and accountability clear.", icon: Building2 },
      { label: "Compliance", detail: "Coordinate obligations and evidence.", icon: ShieldCheck },
      { label: "Risk", detail: "Track risk ownership early.", icon: Scale },
      { label: "Legal and Policies", detail: "Store agreements and controlled guidance.", icon: Database },
    ],
    additionalCapabilityCount: 0,
    screenshot: (
      <ShotShell title="Corporate · Governance" accentRgb="148, 163, 184">
        <KpiRow items={["Entities", "Risk", "Policies"]} accentRgb="148, 163, 184" />
        <ListRows
          rows={["Board resolutions", "Vendor contracts", "Policy register", "Compliance evidence"]}
          accentRgb="148, 163, 184"
        />
      </ShotShell>
    ),
  },
  {
    id: "operations",
    title: "Operations",
    shortTitle: "Operations",
    subtitle: "Assets and logistics",
    description: "Assets, inventory, logistics and procurement.",
    accentRgb: "6, 182, 212",
    icon: Package,
    featuredCapabilities: [
      { label: "Assets", detail: "Know what you own and who is accountable.", icon: Boxes },
      { label: "Inventory", detail: "Monitor stock across locations.", icon: Package },
      { label: "Logistics", detail: "Coordinate shipments and flow.", icon: Truck },
      { label: "Procurement", detail: "Run purchasing from request to receipt.", icon: Handshake },
    ],
    additionalCapabilityCount: 0,
    screenshot: (
      <ShotShell title="Operations · Inventory & Logistics" accentRgb="6, 182, 212">
        <KpiRow items={["Assets", "Stock", "Orders"]} accentRgb="6, 182, 212" />
        <ListRows
          rows={["Field kits", "Warehouse transfer", "PO approvals", "Inbound shipments"]}
          accentRgb="6, 182, 212"
        />
      </ShotShell>
    ),
  },
  {
    id: "business-productivity",
    title: "Business Productivity",
    shortTitle: "Productivity",
    subtitle: "Communication and knowledge",
    description: "Email, calendar, documents, knowledge, collaboration and communications.",
    accentRgb: "99, 102, 241",
    icon: MessageSquare,
    featuredCapabilities: [
      { label: "Email and Calendar", detail: "Operate shared inboxes and schedules.", icon: Mail },
      { label: "Documents and Knowledge", detail: "Keep knowledge searchable and structured.", icon: Database },
      { label: "Collaboration", detail: "Connect teams through organised channels.", icon: MessageSquare },
      { label: "Communications", detail: "Coordinate live and async conversations.", icon: Users },
    ],
    additionalCapabilityCount: 0,
    screenshot: (
      <ShotShell title="Business Productivity · Collaboration" accentRgb="99, 102, 241">
        <KpiRow items={["Unread", "Meetings", "Docs"]} accentRgb="99, 102, 241" />
        <ListRows
          rows={["Ops channel", "Shared inbox", "Weekly standup", "Knowledge base"]}
          accentRgb="99, 102, 241"
        />
      </ShotShell>
    ),
  },
  {
    id: "business-app-integrations",
    title: "Business App Integrations",
    shortTitle: "Integrations",
    subtitle: "Connect your systems",
    description:
      "Microsoft 365, Google Workspace, finance systems, CRM systems, REST APIs and custom integrations.",
    accentRgb: "100, 116, 139",
    icon: Plug,
    featuredCapabilities: [
      { label: "Microsoft 365", detail: "Connect identity, documents and collaboration.", icon: Cloud },
      { label: "Google Workspace", detail: "Bring Google productivity into the platform.", icon: Mail },
      { label: "Finance and CRM Systems", detail: "Sync accounting and commercial platforms.", icon: Wallet },
      { label: "REST APIs and Custom", detail: "Extend Unit311 Central securely.", icon: Plug },
    ],
    additionalCapabilityCount: 0,
    screenshot: (
      <ShotShell title="Business App Integrations · Connections" accentRgb="100, 116, 139">
        <KpiRow items={["Connected", "Syncing", "Alerts"]} accentRgb="100, 116, 139" />
        <ListRows
          rows={["Microsoft 365", "Google Workspace", "Xero", "Custom webhook"]}
          accentRgb="100, 116, 139"
        />
      </ShotShell>
    ),
  },
];

export default function AboutWorkspaceShowcase() {
  const [activeId, setActiveId] = useState(WORKSPACES[0].id);
  const labelId = useId();
  const panelId = useId();
  const active = WORKSPACES.find((workspace) => workspace.id === activeId) ?? WORKSPACES[0];
  const ActiveIcon = active.icon;

  return (
    <section aria-labelledby={labelId} className="workspace-showcase">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93c5fd] sm:text-xs sm:tracking-[0.28em]">
          Product
        </p>
        <h2 id={labelId} className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Explore the Unit311 Central Workspace
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/68 sm:text-[16px]">
          Select a workspace to see how Unit311 Central brings that part of the business into one
          intelligent operating environment.
        </p>
      </div>

      <div className="workspace-showcase-shell mt-6 overflow-hidden rounded-[24px] border border-white/12 bg-white/[0.035] shadow-[0_24px_64px_rgba(0,0,0,0.35)] backdrop-blur-md sm:mt-7 sm:rounded-[28px]">
        <div
          role="tablist"
          aria-label="Unit311 Central workspaces"
          className="workspace-showcase-tabs flex flex-nowrap gap-1.5 overflow-x-auto border-b border-white/10 p-2.5 sm:gap-2 sm:p-3 lg:grid lg:grid-cols-10 lg:overflow-visible"
        >
          {WORKSPACES.map((workspace) => {
            const Icon = workspace.icon;
            const isActive = workspace.id === active.id;
            return (
              <button
                key={workspace.id}
                type="button"
                role="tab"
                id={`${panelId}-${workspace.id}`}
                aria-selected={isActive}
                aria-controls={panelId}
                onClick={() => setActiveId(workspace.id)}
                className={[
                  "workspace-showcase-tab relative flex min-h-[3.75rem] min-w-[7.5rem] flex-1 flex-col items-start justify-center gap-1.5 overflow-hidden rounded-xl border px-2.5 py-2 text-left sm:min-h-[4.25rem] sm:min-w-0 sm:px-3",
                  isActive ? "is-active" : "is-idle",
                ].join(" ")}
                style={{ "--ws-accent-rgb": workspace.accentRgb } as CSSProperties}
              >
                <span className="workspace-showcase-card-accent" aria-hidden />
                <span className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10"
                    style={{
                      color: `rgb(${workspace.accentRgb})`,
                      background: `rgba(${workspace.accentRgb}, ${isActive ? 0.18 : 0.1})`,
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-semibold leading-tight text-white sm:text-[12px]">
                      {workspace.shortTitle}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-white/40">
                      {workspace.subtitle}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={`${panelId}-${active.id}`}
          className="workspace-showcase-stage px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4 lg:px-6 lg:pb-6 lg:pt-4"
          style={{ "--ws-accent-rgb": active.accentRgb } as CSSProperties}
        >
          <div
            key={active.id}
            className="workspace-showcase-fade grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]"
          >
            <div className="flex min-h-0 flex-col">
              <div className="flex items-start gap-3 sm:gap-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/12 sm:h-11 sm:w-11"
                  style={{
                    color: `rgb(${active.accentRgb})`,
                    background: `rgba(${active.accentRgb}, 0.14)`,
                    boxShadow: `0 0 24px rgba(${active.accentRgb}, 0.2)`,
                  }}
                >
                  <ActiveIcon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[1.15rem] font-semibold tracking-[-0.02em] text-white sm:text-[1.35rem]">
                    {active.title}
                  </h3>
                  <p
                    className="mt-1 truncate text-[12px] font-semibold tracking-[0.01em] sm:text-[13px]"
                    style={{ color: `rgba(${active.accentRgb}, 0.9)` }}
                  >
                    {active.subtitle}
                  </p>
                  <p className="mt-2 line-clamp-2 max-w-2xl text-[13px] leading-relaxed text-white/62 sm:text-[14px]">
                    {active.description}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex min-h-0 flex-1 flex-col sm:mt-6">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: `rgba(${active.accentRgb}, 0.85)` }}
                >
                  Key capabilities
                </p>

                <ul className="workspace-showcase-capability-grid mt-3 grid flex-1 grid-cols-2 gap-2.5 sm:gap-3">
                  {active.featuredCapabilities.map((feature) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <li key={feature.label} className="workspace-showcase-capability-card">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 sm:h-9 sm:w-9"
                          style={{
                            color: `rgb(${active.accentRgb})`,
                            background: `rgba(${active.accentRgb}, 0.12)`,
                          }}
                        >
                          <FeatureIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.6} aria-hidden />
                        </span>
                        <p className="mt-2.5 line-clamp-1 text-[12.5px] font-semibold leading-snug text-white/90 sm:mt-3 sm:text-[13.5px]">
                          {feature.label}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-white/48 sm:text-[12.5px]">
                          {feature.detail}
                        </p>
                      </li>
                    );
                  })}
                </ul>

                <p className="workspace-showcase-more mt-3 text-[12px] leading-none text-white/42 sm:mt-3.5 sm:text-[12.5px]">
                  {active.additionalCapabilityCount > 0
                    ? `Plus ${active.additionalCapabilityCount} additional capabilities...`
                    : "\u00a0"}
                </p>
              </div>
            </div>

            <div className="workspace-showcase-shot mx-auto w-full max-w-[560px] lg:mx-0 lg:max-w-none lg:self-stretch">
              {active.screenshot}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
