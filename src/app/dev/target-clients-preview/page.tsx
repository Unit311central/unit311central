import { notFound } from "next/navigation";

import TargetClientsOpeningScreen from "@/components/testflighthub/sales-management/TargetClientsOpeningScreen";
import PlatformThemeProvider from "@/components/testflighthub/PlatformThemeProvider";

type DevPreviewPageProps = {
  searchParams: Promise<{ variant?: string }>;
};

/**
 * Design-only Target Clients opening screen — development environment only.
 * No auth, no API, no database. Not linked from production workspace hosts.
 */
export default async function TargetClientsDevPreviewPage({ searchParams }: DevPreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const variant = params.variant === "live" ? "live" : "design-preview";

  return (
    <PlatformThemeProvider>
      <div
        className="min-h-dvh text-white"
        style={{
          background:
            "radial-gradient(ellipse at top, color-mix(in srgb, #7c3aed 12%, transparent), transparent 55%), linear-gradient(180deg, #0B1524 0%, #050B16 100%)",
        }}
      >
        <header
          className="border-b px-4 py-3 sm:px-6"
          style={{ borderColor: "color-mix(in srgb, #243347 70%, transparent)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300/80">
            Design preview · development only
          </p>
          <p className="mt-1 text-xs text-white/45">
            Sales Management → Sales → Target Clients (visual mock — fictional data)
          </p>
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 md:px-8">
          <TargetClientsOpeningScreen variant={variant} />
        </main>
      </div>
    </PlatformThemeProvider>
  );
}
