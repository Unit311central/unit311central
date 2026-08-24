"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import {
  INTERFACE_WORX_WEBSITE_HOST,
  INTERFACE_WORX_WEBSITE_LOGO_INTRINSIC_HEIGHT,
  INTERFACE_WORX_WEBSITE_LOGO_INTRINSIC_WIDTH,
  INTERFACE_WORX_WEBSITE_LOGO_SRC,
} from "@/lib/interface-worx-surface";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

type InterfaceWorxWebsiteNavProps = {
  className?: string;
};

export default function InterfaceWorxWebsiteNav({ className }: InterfaceWorxWebsiteNavProps) {
  const [open, setOpen] = useState(false);
  const logoHeight = 36;
  const logoWidth = Math.round(
    (logoHeight * INTERFACE_WORX_WEBSITE_LOGO_INTRINSIC_WIDTH) /
      INTERFACE_WORX_WEBSITE_LOGO_INTRINSIC_HEIGHT,
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center"
          aria-label="Interface Worx home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={INTERFACE_WORX_WEBSITE_LOGO_SRC}
            alt="Interface Worx"
            width={logoWidth}
            height={logoHeight}
            className="h-9 w-auto max-w-[200px] object-contain object-left"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-700 transition-colors hover:text-[#CC5500] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CC5500]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 md:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CC5500]"
          aria-expanded={open}
          aria-controls="iw-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
        </button>
      </div>

      {open ? (
        <nav
          id="iw-mobile-nav"
          className="border-t border-slate-200 bg-white px-4 py-4 md:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-md px-2 py-2 text-base font-medium text-slate-800 hover:bg-slate-50 hover:text-[#CC5500] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CC5500]"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

export function InterfaceWorxWebsiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Link href="/" className="inline-flex items-center" aria-label="Interface Worx home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={INTERFACE_WORX_WEBSITE_LOGO_SRC}
                alt="Interface Worx"
                width={160}
                height={28}
                className="h-7 w-auto object-contain object-left"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Interface Worx develops prosthetic interface technologies that improve outcomes and
              widen access to essential care for people living with amputation worldwide.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
              Navigation
            </h2>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 hover:text-[#CC5500] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CC5500]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
              Contact
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>
                <a
                  href="mailto:info@interfaceworx.com"
                  className="hover:text-[#CC5500] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CC5500]"
                >
                  info@interfaceworx.com
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/interfaceworx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#CC5500] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CC5500]"
                >
                  Interface Worx on LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-slate-200 pt-8 text-center text-xs text-slate-500">
          © 2026 Interface Worx. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
