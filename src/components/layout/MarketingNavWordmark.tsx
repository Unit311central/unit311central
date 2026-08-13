import Link from "next/link";

import Unit311CentralWordmark from "@/components/layout/Unit311CentralWordmark";

type MarketingNavWordmarkProps = {
  compact?: boolean;
};

export default function MarketingNavWordmark({ compact = false }: MarketingNavWordmarkProps) {
  return (
    <Link
      href="/"
      aria-label="Unit311 Central home"
      className={`inline-flex min-h-11 min-w-0 shrink items-center overflow-visible ${
        compact
          ? "max-w-[calc(100vw-5.25rem-env(safe-area-inset-left)-env(safe-area-inset-right))] sm:max-w-none"
          : "max-w-[calc(100vw-4.75rem-env(safe-area-inset-left)-env(safe-area-inset-right))] sm:max-w-none"
      }`}
    >
      <Unit311CentralWordmark
        variant="nav"
        className="drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]"
      />
    </Link>
  );
}
