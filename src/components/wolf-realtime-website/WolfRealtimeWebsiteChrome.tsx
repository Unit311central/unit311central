import Link from "next/link";

import WolfLogoMark from "@/components/layout/WolfLogoMark";
import { WOLF_REALTIME_CONTACT_EMAIL } from "@/lib/wolf-realtime-website-surface";

export function WolfRealtimeWebsiteFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#060908] py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <WolfLogoMark size="sm" />
        <a
          href={`mailto:${WOLF_REALTIME_CONTACT_EMAIL}`}
          className="text-sm font-medium tracking-wide text-emerald-200/90 transition-colors hover:text-emerald-100"
        >
          {WOLF_REALTIME_CONTACT_EMAIL}
        </a>
      </div>
    </footer>
  );
}

export default function WolfRealtimeWebsiteNav() {
  return (
    <header className="border-b border-white/[0.06] bg-[#080c0a]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="inline-block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400/60">
          <WolfLogoMark size="md" />
        </Link>
        <a
          href={`mailto:${WOLF_REALTIME_CONTACT_EMAIL}?subject=WOLF%20demonstration%20request`}
          className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55 transition-colors hover:text-white/85 sm:inline"
        >
          Contact
        </a>
      </div>
    </header>
  );
}
