"use client";

import { Building2, Globe2, Shield, Users } from "lucide-react";
import Link from "next/link";

import { getDemoEnterpriseFixtures } from "@/lib/demo-enterprise";

const PORTAL_TYPES = [
  {
    title: "Client portal",
    description: "Project status, documents, support and billing for anchor customers like Meridian Packaging Group.",
    href: "/demo-client-portal",
    icon: Building2,
  },
  {
    title: "Investor portal",
    description: "Fundraising data rooms, board packs and cap table visibility for investors and NEDs.",
    href: "/?view=fundraising-data-rooms",
    icon: Globe2,
  },
  {
    title: "Board portal",
    description: "Meetings, minutes, risk register and governance for directors.",
    href: "/board",
    icon: Shield,
  },
  {
    title: "Partner / supplier portal",
    description: "Onboarding, compliance and delivery coordination for suppliers such as Voltex Automation.",
    href: "/?view=external-client-access",
    icon: Users,
  },
] as const;

export default function DemoPortalsShowcase() {
  const fixtures = getDemoEnterpriseFixtures();

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 sm:p-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-300/80">Unit311 Central · Demo</p>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Stakeholder portals</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-white/65">
          From the same {fixtures.company.tradingName} workspace, Unit311 can expose tailored portals for clients,
          investors, board members and partners — each with scoped data and branding.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {PORTAL_TYPES.map((portal) => (
          <Link
            key={portal.title}
            href={portal.href}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-sky-400/30 hover:bg-sky-500/5"
          >
            <portal.icon className="h-6 w-6 text-sky-300" />
            <h2 className="mt-3 text-lg font-semibold text-white group-hover:text-sky-100">{portal.title}</h2>
            <p className="mt-2 text-sm text-white/60">{portal.description}</p>
            <span className="mt-4 inline-block text-sm text-sky-300">Explore →</span>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#07111f]/60 p-5 text-sm text-white/60">
        <p>
          All portals run on <strong className="text-white/80">demo.unit311central.com</strong> — no separate tenants.
          External integrations (email, WhatsApp, Wise) are simulated in Demo.
        </p>
        <Link href="/dashboard" className="mt-3 inline-block text-sky-300 hover:underline">
          Return to workspace →
        </Link>
      </div>
    </div>
  );
}
