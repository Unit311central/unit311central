import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Download WOLF Central | Android",
  description: "Install the WOLF Central Android app (full workspace on wolf.unit311central.com).",
  robots: { index: false, follow: false },
};

export default function AppDownloadPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-12 text-white">
      <p className="text-sm uppercase tracking-[0.16em] text-white/40">Android</p>
      <h1 className="mt-3 text-2xl font-semibold">WOLF Central</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/60">
        Full WOLF workspace on your phone: sign in at wolf.unit311central.com, same sidebar and Tools
        as desktop. You may need to allow installs from your browser in Android settings.
      </p>

      <a
        href="/downloads/bcn-drone-center.apk"
        download
        className="mt-8 inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-4 text-center text-sm font-semibold text-white hover:bg-sky-500"
      >
        Download APK
      </a>

      <ol className="mt-8 space-y-2 text-sm text-white/55">
        <li>1. Download the APK</li>
        <li>2. Open the downloaded file</li>
        <li>3. Allow install if Android asks</li>
        <li>4. Open WOLF Central from your app drawer and sign in</li>
      </ol>

      <Link href="/" className="mt-10 text-sm text-white/40 hover:text-white/70">
        Back to website
      </Link>
    </main>
  );
}
