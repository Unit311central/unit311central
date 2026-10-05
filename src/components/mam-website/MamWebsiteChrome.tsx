"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import {
  MAM_CONTACT_EMAIL,
  MAM_LOCATION_LABEL,
  MAM_PUBLIC_NAV,
  MAM_WEBSITE_LOGO_SRC,
} from "@/lib/mam/mam-website";
import { cn } from "@/lib/utils";

const MAM_LOGO_WIDTH = 1416;
const MAM_LOGO_HEIGHT = 1111;

function MamLogo({ compact }: { compact?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- intrinsic width/height + max box keeps aspect ratio without overflow
    <img
      src={MAM_WEBSITE_LOGO_SRC}
      alt="MAM — Moroccan Advanced Manufacturing"
      width={MAM_LOGO_WIDTH}
      height={MAM_LOGO_HEIGHT}
      decoding="async"
      fetchPriority={compact ? "auto" : "high"}
      className={cn(
        "block h-auto w-auto shrink-0 object-contain object-left",
        compact ? "max-h-[56px] max-w-[150px]" : "max-h-[70px] max-w-[190px]",
      )}
    />
  );
}

export default function MamWebsiteNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const path = pathname?.replace(/^\/sites\/mam/, "") || "/";
  const browserPath = path === "" ? "/" : path;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0c0e11]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[92px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex h-full shrink-0 items-center" aria-label="MAM home">
          <MamLogo />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {MAM_PUBLIC_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-[#a8bac9]",
                browserPath === link.href ? "text-[#8fa4b8]" : "text-white/75",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-sm bg-[#8fa4b8] px-4 py-2 text-sm font-semibold text-[#0c0e11] transition-colors hover:bg-[#a8bac9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fa4b8]"
          >
            Request a Quote
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-sm p-2 text-white lg:hidden"
          aria-expanded={open}
          aria-controls="mam-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open ? (
        <nav
          id="mam-mobile-nav"
          className="border-t border-white/10 bg-[#0c0e11] px-4 py-4 lg:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-1">
            {MAM_PUBLIC_NAV.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-sm px-2 py-2.5 text-base font-medium text-white/90 hover:bg-white/5"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/contact"
                className="block rounded-sm bg-[#8fa4b8] px-4 py-2.5 text-center text-sm font-semibold text-[#0c0e11]"
                onClick={() => setOpen(false)}
              >
                Request a Quote
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

export function MamWebsiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-[#08090b] text-white/70">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <MamLogo />
            <p className="mt-3 text-sm font-medium text-white/90">Moroccan Advanced Manufacturing</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              Advanced additive manufacturing and precision production from Casablanca, Morocco.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Navigation</p>
            <ul className="mt-4 space-y-2 text-sm">
              {MAM_PUBLIC_NAV.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-[#8fa4b8]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Contact</p>
            <p className="mt-4 text-sm">{MAM_LOCATION_LABEL}</p>
            <p className="mt-2 text-sm">
              <a href={`mailto:${MAM_CONTACT_EMAIL}`} className="hover:text-[#8fa4b8]">
                {MAM_CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </div>
        <p className="mt-12 border-t border-white/10 pt-8 text-center text-xs text-white/40">
          © {year} MAM — Moroccan Advanced Manufacturing
        </p>
      </div>
    </footer>
  );
}

