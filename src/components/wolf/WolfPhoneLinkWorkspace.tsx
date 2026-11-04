"use client";

import { useEffect, useState } from "react";

import { wolfCardClass, wolfEyebrowClass, wolfShellClass } from "@/components/wolf/wolf-ui";
import { PHONE_LOGGER_INTERVAL_SECONDS, WOLF_PHONE_LINK_PATH } from "@/lib/wolf/phone-telemetry";

type Recipe = {
  path: string;
  body: string;
  intervalSeconds: number;
};

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-wide text-white/45">{label}</p>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(value).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-black/40 p-3 font-mono text-xs text-white/90">
        {value}
      </pre>
    </div>
  );
}

export default function WolfPhoneLinkWorkspace() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(WOLF_PHONE_LINK_PATH, { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setError("WOLF could not prepare the phone key.");
          return;
        }
        const payload = (await response.json()) as Recipe;
        if (!cancelled) setRecipe(payload);
      } catch {
        if (!cancelled) setError("The phone could not reach WOLF.");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const endpoint = recipe ? `${window.location.origin}${recipe.path}` : "";

  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-6 max-w-3xl">
        <p className={wolfEyebrowClass}>Tools</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Phone Link</h1>
        <p className="mt-2 text-sm text-white/70">
          Brix stays full screen on stream key test. GPSLogger sends the location in the background, and WOLF draws it on the WebRTC page. The picture stays clean.
        </p>
      </header>
      <section className={`${wolfCardClass} max-w-xl px-4 py-4`}>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-white/80">
          <li>
            Install{" "}
            <a className="underline" href="https://f-droid.org/packages/com.mendhak.gpslogger/">
              GPSLogger
            </a>{" "}
            from F-Droid.
          </li>
          <li>Open Logging details and turn on Log to custom URL.</li>
          <li>Set the method to POST.</li>
          <li>
            Under HTTP headers, add one line:{" "}
            <span className="font-mono text-xs text-white/90">
              Content-Type: application/x-www-form-urlencoded
            </span>
          </li>
          <li>Paste the URL and the HTTP body below (not the header field).</li>
          <li>In GPSLogger, enable <span className="font-semibold">Log to custom URL</span> and tap Start on the main screen.</li>
          <li>Set the logging interval to {PHONE_LOGGER_INTERVAL_SECONDS} seconds.</li>
          <li>When Android asks, allow location all the time.</li>
          <li>Start logging, leave the GPSLogger notification on, then open Brix.</li>
        </ol>
        {error ? (
          <p className="mt-4 text-sm text-white/80" role="status">
            {error}
          </p>
        ) : null}
        {recipe ? (
          <>
            <CopyBlock label="URL" value={endpoint} />
            <CopyBlock label="HTTP body" value={recipe.body} />
          </>
        ) : null}
      </section>
      <section className={`${wolfCardClass} mt-6 max-w-xl px-4 py-4`}>
        <h2 className="text-sm font-semibold text-white">Field capture</h2>
        <p className="mt-2 text-sm text-white/70">
          Log position, take photos, and record clips from the phone on{" "}
          <span className="font-semibold text-white">Tools → WOLF Test Ground WebRTC</span>. The buttons sit in the right-hand column next to the live video.
        </p>
      </section>
    </div>
  );
}
