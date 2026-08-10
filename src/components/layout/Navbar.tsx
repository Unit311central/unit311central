"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import MarketingNavWordmark from "@/components/layout/MarketingNavWordmark";
import { isClientCallRoute } from "@/lib/client-call-routes";
import {
  BOOK_SUBMITTED_EVENT,
  clearBookFormSubmitted,
  isBookFormSubmitted,
} from "@/lib/book-submission-state";
import {
  isMarketingRoute,
} from "@/lib/marketing-ui";
import MobileMenu from "./MobileMenu";

const NAV = [
  { href: "/", label: "Home", hash: null, chevron: false },
  { href: "/#platform", label: "Platform", hash: "platform", chevron: false },
  { href: "/#pricing", label: "Pricing", hash: "pricing", chevron: false },
  { href: "/faq", label: "FAQ", hash: null, chevron: false },
  { href: "/about", label: "About", hash: null, chevron: false },
  { href: "/contact", label: "Contact", hash: null, chevron: false },
] as const;

function scrollToSection(hash: string) {
  const target = document.getElementById(hash);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookFormSubmitted, setBookFormSubmitted] = useState(false);
  const [isInternalAppHost] = useState(() => {
    if (typeof window === "undefined") return false;
    const host = window.location.hostname.toLowerCase();
    const onInternalHost =
      host === "internal.unit311central.com" || host === "internal.localhost";
    const onCustomerHost =
      host.endsWith(".unit311central.com") &&
      host !== "unit311central.com" &&
      host !== "www.unit311central.com" &&
      host !== "internal.unit311central.com";
    return onInternalHost || onCustomerHost;
  });
  const pathname = usePathname();
  const isLoginPage =
    pathname === "/login" ||
    pathname === "/clientlogin" ||
    pathname === "/resetpassword";
  const isHomePage = pathname === "/" || pathname === null;
  const isMarketingPage = isMarketingRoute(pathname);
  const isBookPage = pathname === "/book";
  const isPaymentPage =
    pathname === "/payment" ||
    pathname === "/payment-transfer";
  const isClientCallPage = isClientCallRoute(pathname);
  const isDarkNav =
    isHomePage ||
    isMarketingPage ||
    isBookPage ||
    isPaymentPage ||
    isLoginPage ||
    isClientCallPage;
  const isWorkspaceHostRoute = Boolean(pathname?.startsWith("/ws/"));
  const isPartnersPage = Boolean(pathname?.startsWith("/partners"));
  const isDashboard =
    isInternalAppHost ||
    isWorkspaceHostRoute ||
    pathname?.startsWith("/test1") ||
    pathname?.startsWith("/client/") ||
    pathname?.startsWith("/testflighthub") ||
    pathname?.startsWith("/internaldashboard") ||
    pathname?.startsWith("/files") ||
    pathname?.startsWith("/users") ||
    pathname?.startsWith("/messaging") ||
    pathname?.startsWith("/crm") ||
    pathname?.startsWith("/telemetry") ||
    pathname?.startsWith("/whatsapp/");

  useEffect(() => {
    if (pathname !== "/book") {
      clearBookFormSubmitted();
      startTransition(() => {
        setBookFormSubmitted(false);
      });
      return;
    }

    startTransition(() => {
      setBookFormSubmitted(isBookFormSubmitted());
    });

    function handleBookSubmitted() {
      setBookFormSubmitted(true);
    }

    window.addEventListener(BOOK_SUBMITTED_EVENT, handleBookSubmitted);
    return () => window.removeEventListener(BOOK_SUBMITTED_EVENT, handleBookSubmitted);
  }, [pathname]);

  if (isDashboard || isClientCallPage || isLoginPage || isPartnersPage) {
    return null;
  }

  if (pathname === "/book" && bookFormSubmitted) {
    return null;
  }

  return (
    <>
      <header
        className={
          isHomePage
            ? "absolute inset-x-0 top-0 z-40 bg-[#020617]/55 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none"
            : isDarkNav
              ? "sticky top-0 z-40 border-b border-white/10 bg-[#020617]/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl"
              : "sticky top-0 z-40 border-b border-border bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl"
        }
      >
        <div
          className={`mx-auto flex max-w-[1400px] items-center sm:px-8 lg:px-10 ${
            isClientCallPage ? "" : "lg:grid lg:grid-cols-[1fr_auto_1fr]"
          } ${
            isHomePage
              ? "h-14 px-3 sm:h-20 lg:h-44 lg:px-6"
              : isClientCallPage
                ? "h-14 px-4 sm:h-16"
                : isMarketingPage
                  ? "h-14 px-3 sm:h-20 lg:h-24"
                  : "h-14 px-3 sm:h-20 lg:h-28"
          }`}
        >
          <div className="flex w-full items-center justify-between lg:contents">
            <div
              className={`flex items-center justify-start overflow-visible ${
                isHomePage ? "w-full max-w-[640px] lg:w-auto" : "min-w-0 overflow-hidden"
              }`}
            >
              {isHomePage ? (
                <>
                  <div className="lg:hidden">
                    <MarketingNavWordmark compact />
                  </div>
                  <span className="sr-only">Unit311 Central</span>
                </>
              ) : (
                <MarketingNavWordmark />
              )}
            </div>

            {!isClientCallPage ? (
              <nav
                aria-label="Main navigation"
                className={`hidden items-center justify-center lg:flex xl:gap-10 ${
                  isHomePage ? "gap-6 xl:gap-8" : "gap-8"
                }`}
              >
                {NAV.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(event) => {
                      if (pathname === "/" && link.hash) {
                        event.preventDefault();
                        scrollToSection(link.hash);
                      }
                      if (pathname === "/" && link.href === "/") {
                        event.preventDefault();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className={`inline-flex items-center gap-1 whitespace-nowrap text-[16px] font-medium transition-colors ${
                      isDarkNav
                        ? "text-white/90 hover:text-white"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {link.label}
                    {link.chevron && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    )}
                  </Link>
                ))}
              </nav>
            ) : null}

            <div
              className={`flex shrink-0 items-center justify-end gap-1 sm:gap-3 xl:gap-6 ${
                isClientCallPage ? "hidden" : ""
              }`}
            >
              <button
                type="button"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border lg:hidden ${
                  isDarkNav ? "border-white/25 text-white" : "border-border text-muted"
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {!isClientCallPage ? (
          <nav
            aria-label="Mobile navigation links"
            className={`border-t lg:hidden ${
              isDarkNav ? "border-white/10 bg-[#020617]/90" : "border-border bg-background/95"
            }`}
          >
            <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(event) => {
                    if (pathname === "/" && link.hash) {
                      event.preventDefault();
                      scrollToSection(link.hash);
                    }
                    if (pathname === "/" && link.href === "/") {
                      event.preventDefault();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className={`shrink-0 rounded-lg px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors ${
                    isDarkNav
                      ? "text-white/85 hover:bg-white/10 hover:text-white"
                      : "text-muted hover:bg-surface-elevated hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>
      {!isClientCallPage ? (
        <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      ) : null}
    </>
  );
}
