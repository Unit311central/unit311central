"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function shouldHideStickyCta(pathname: string | null) {
  if (!pathname) return true;
  if (pathname === "/book" || pathname === "/login" || pathname === "/signup") return true;
  if (pathname.startsWith("/partners") || pathname.startsWith("/dev/")) return true;
  if (pathname.startsWith("/ws/") || pathname.startsWith("/meet/")) return true;
  return false;
}

export default function MobileStickyBookCta() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (shouldHideStickyCta(pathname)) {
      setVisible(false);
      return;
    }

    const onScroll = () => {
      setVisible(window.scrollY > 420);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  if (shouldHideStickyCta(pathname) || !visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="pointer-events-auto border-t border-white/10 bg-[#020617]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <Link
          href="/book"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2563eb] text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
        >
          Book a demo
        </Link>
      </div>
    </div>
  );
}
