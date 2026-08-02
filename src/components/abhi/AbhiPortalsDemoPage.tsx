"use client";

import Image from "next/image";
import Link from "next/link";
import { Manrope, Syne } from "next/font/google";
import { ArrowUpRight, Copy, Check } from "lucide-react";
import { useState } from "react";

import MarketingPageShell from "@/components/layout/MarketingPageShell";
import AbhiLogoMark from "@/components/layout/AbhiLogoMark";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

const display = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-portals-display",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-portals-body",
});

const LOGIN_BACKGROUND = "/images/login-workspace-bg.webp";
const UNIT311_LOGO = "/images/unit311central-login.webp";

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
];

type ModuleGroup = {
  title: string;
  items?: string[];
};

const MAJOR_MODULES: ModuleGroup[] = [
  { title: "Home dashboard" },
  { title: "AI Executive Assistant" },
  { title: "Business Central" },
  {
    title: "Members",
    items: ["Dashboard Overview", "Member Directory"],
  },
  {
    title: "Customer Management",
    items: ["Pipeline", "Discovery Calls", "Member onboarding"],
  },
  {
    title: "Projects",
    items: ["Internal projects", "External projects", "Grants"],
  },
  { title: "Partners" },
  { title: "Financials" },
  { title: "Human Resources" },
  { title: "Marketing and Events" },
  { title: "Corporate Information" },
  { title: "Technology Management" },
  { title: "Business Productivity" },
  { title: "Operations" },
  { title: "Training" },
  { title: "QMS" },
  { title: "Tools" },
  { title: "External Client Access" },
  { title: "Settings" },
];

const ABHI_CUSTOM_MODULES = [
  "Member and Relationship",
  "Regulatory Intelligence Hub",
  "Board Portal",
  "Member Portal",
  "External events",
  "ABHI events",
  "Digital Newsletter",
  "ABHI Working groups",
  "ABHI Accelerators",
  "Mailing List Management",
  "Social media",
  "Create training course from document upload",
  "Board pack automated via AI Exec Assistant",
  "Custom messaging and chat channels",
  "Internal to internal and external voice and video — no separate app",
  "Customised views per logged in user",
  "Move away from using your website for data repository",
  "UK Healthcare pavilion management",
  "Works as app on Apple or Android",
];

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore clipboard failures in restricted contexts.
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

function CredentialCard({ block, index }: { block: CredentialBlock; index: number }) {
  return (
    <article
      className="portals-rise rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.09] to-white/[0.02] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md"
      style={{ animationDelay: `${120 + index * 90}ms` }}
    >
      <h3 className="font-[family-name:var(--font-portals-display)] text-[15px] font-bold tracking-tight text-white">
        {block.title}
      </h3>
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

export default function AbhiPortalsDemoPage() {
  return (
    <div className={cn(display.variable, body.variable, body.className)}>
      <style>{`
        @keyframes portals-rise {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes portals-glow {
          0%,
          100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.7;
          }
        }
        .portals-rise {
          animation: portals-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .portals-glow {
          animation: portals-glow 5s ease-in-out infinite;
        }
      `}</style>

      <MarketingPageShell
        backgroundImage={LOGIN_BACKGROUND}
        backgroundImageClassName="object-cover object-[center_30%] opacity-75 sm:object-center"
        backgroundImageQuality={92}
        overlayClassName="absolute inset-0 bg-gradient-to-b from-[#020617]/55 via-[#07111f]/78 to-[#020617]/92"
        contentClassName="relative z-10 mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#C2185B]/15 to-transparent portals-glow" />

        <header className="portals-rise relative flex items-center justify-between gap-4">
          <Link href="https://unit311central.com" className="shrink-0" aria-label={SITE_NAME}>
            <div className="relative h-9 w-[160px] sm:h-10 sm:w-[190px]">
              <Image
                src={UNIT311_LOGO}
                alt={SITE_NAME}
                fill
                priority
                sizes="190px"
                className="object-contain object-left drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
              />
            </div>
          </Link>
          <AbhiLogoMark height={36} tone="onDark" priority />
        </header>

        <section className="portals-rise relative mt-8 max-w-3xl sm:mt-10" style={{ animationDelay: "60ms" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F48FB1]">
            Pre-demo briefing
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-portals-display)] text-[2rem] font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-[2.75rem]">
            ABHI on Unit311 Central
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/65 sm:text-[15px]">
            Credential and capability overview for your demonstration. Platform access for this
            briefing is limited to <span className="text-white/90">demo@abhi.org.uk</span> — after
            sign-in you return here.
          </p>
        </section>

        <div className="relative mt-8 grid gap-5 lg:mt-10 lg:grid-cols-3 lg:gap-6">
          <section className="portals-rise space-y-3" style={{ animationDelay: "120ms" }}>
            <div className="border-b border-white/10 pb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
                Column 1
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-portals-display)] text-lg font-bold text-white">
                Platform Login
              </h2>
            </div>
            <div className="space-y-3">
              {PLATFORM_LOGINS.map((block, index) => (
                <CredentialCard key={block.title} block={block} index={index} />
              ))}
            </div>
          </section>

          <section className="portals-rise space-y-3" style={{ animationDelay: "200ms" }}>
            <div className="border-b border-white/10 pb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
                Column 2
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-portals-display)] text-lg font-bold text-white">
                Major Modules
              </h2>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4 backdrop-blur-md">
              <ul className="space-y-2.5">
                {MAJOR_MODULES.map((module) => (
                  <li key={module.title}>
                    <p className="text-[13px] font-semibold text-white/90">{module.title}</p>
                    {module.items ? (
                      <ul className="mt-1 space-y-1 border-l border-white/10 pl-3">
                        {module.items.map((item) => (
                          <li key={item} className="text-[12px] text-white/55">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="portals-rise space-y-3" style={{ animationDelay: "280ms" }}>
            <div className="border-b border-white/10 pb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F48FB1]/90">
                Column 3
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-portals-display)] text-lg font-bold text-white">
                ABHI Customised Modules
              </h2>
            </div>
            <div className="rounded-2xl border border-[#C2185B]/25 bg-gradient-to-b from-[#C2185B]/12 to-white/[0.03] p-4 backdrop-blur-md">
              <ul className="space-y-2.5">
                {ABHI_CUSTOM_MODULES.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[13px] leading-snug text-white/85">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F48FB1]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <footer
          className="portals-rise mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[11px] text-white/40"
          style={{ animationDelay: "360ms" }}
        >
          <p>
            {SITE_NAME} · Confidential demonstration material for ABHI
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-medium text-sky-300/80 transition hover:text-sky-200"
          >
            Open platform login
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </MarketingPageShell>
    </div>
  );
}
