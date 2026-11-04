import type { Metadata } from "next";
import Link from "next/link";

import { WOLF_CENTRAL_ORIGIN } from "@/lib/wolf/wolf-surface";

export const metadata: Metadata = {
  title: "Install WOLF Central | Android & iPhone",
  description:
    "Install WOLF Central on Android (APK) or iPhone (Safari). Full workspace on wolf.unit311central.com.",
  robots: { index: false, follow: false },
};

const LOGIN_URL = `${WOLF_CENTRAL_ORIGIN}/login`;
const INSTALL_URL = `${WOLF_CENTRAL_ORIGIN}/app-download`;

export default function AppDownloadPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-12 text-white">
      <p className="text-sm uppercase tracking-[0.16em] text-white/40">Install</p>
      <h1 className="mt-3 text-2xl font-semibold">WOLF Central</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/60">
        Same WOLF workspace as desktop: sign in, Tools, WebRTC, Phone Link, field capture. Send this
        page to a tester — Android installs the app file; iPhone uses Safari (Apple does not allow
        APK-style installs).
      </p>

      <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-sm font-semibold text-white">Android</h2>
        <p className="mt-2 text-sm text-white/55">
          Download the debug build, open the file, allow install if prompted, then sign in.
        </p>
        <a
          href="/downloads/bcn-drone-center.apk"
          download
          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500"
        >
          Download APK
        </a>
        <ol className="mt-4 space-y-1.5 text-xs text-white/50">
          <li>1. Download APK</li>
          <li>2. Open the file → Install</li>
          <li>3. Open WOLF Central → sign in</li>
          <li>4. Allow location when using WebRTC / Send GPS</li>
        </ol>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-sm font-semibold text-white">iPhone (Apple)</h2>
        <p className="mt-2 text-sm text-white/55">
          There is no APK for iPhone. Testers use Safari — same site as the app shell. For a
          home-screen icon: Share → Add to Home Screen.
        </p>
        <a
          href={LOGIN_URL}
          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-5 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25"
        >
          Open WOLF in Safari
        </a>
        <ol className="mt-4 space-y-1.5 text-xs text-white/50">
          <li>1. Open the link above in Safari (not Chrome)</li>
          <li>2. Sign in with your WOLF account</li>
          <li>3. Optional: Share → Add to Home Screen</li>
          <li>4. Tools → Phone Link / WebRTC (Brix + GPSLogger on Android only for stream)</li>
        </ol>
        <p className="mt-3 text-xs text-white/45">
          TestFlight (App Store beta) needs an Apple Developer account — not set up yet. Safari is
          the supported tester path for iOS today.
        </p>
      </section>

      <p className="mt-8 break-all text-xs text-white/40">
        Share link: {INSTALL_URL}
      </p>

      <Link href="/" className="mt-6 text-sm text-white/40 hover:text-white/70">
        Back to website
      </Link>
    </main>
  );
}
