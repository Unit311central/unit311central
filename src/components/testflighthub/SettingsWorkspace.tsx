"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Settings, Share2 } from "lucide-react";

type PlatformCredentials = {
  id: "linkedin" | "instagram";
  name: string;
  accent: string;
  accentBorder: string;
  icon: React.ReactNode;
  urlPlaceholder: string;
};

const PLATFORMS: PlatformCredentials[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    accent: "from-[#0A66C2]/20 to-[#0A66C2]/5",
    accentBorder: "border-[#0A66C2]/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold text-white">
        in
      </span>
    ),
    urlPlaceholder: "https://www.linkedin.com/company/bcndrone",
  },
  {
    id: "instagram",
    name: "Instagram",
    accent: "from-fuchsia-500/20 via-pink-500/15 to-amber-500/10",
    accentBorder: "border-pink-400/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-[10px] font-bold text-white">
        IG
      </span>
    ),
    urlPlaceholder: "https://www.instagram.com/bcndrone",
  },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
      {children}
    </label>
  );
}

function inputClassName() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-400/50 placeholder:text-white/30";
}

function PlatformCredentialsCard({ platform }: { platform: PlatformCredentials }) {
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-white/[0.04] shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl",
        platform.accentBorder,
      )}
    >
      <div
        className={cn(
          "border-b border-white/10 bg-gradient-to-r px-4 py-4 sm:px-5",
          platform.accent,
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/30 text-white">
            {platform.icon}
          </div>
          <div>
            <h3 className="text-base font-semibold text-white sm:text-lg">{platform.name}</h3>
            <p className="text-xs text-white/50">Account credentials</p>
          </div>
        </div>
      </div>

      <form
        className="space-y-4 p-4 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <div>
          <FieldLabel>{platform.name} URL</FieldLabel>
          <input
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder={platform.urlPlaceholder}
            className={inputClassName()}
          />
        </div>

        <div>
          <FieldLabel>Username</FieldLabel>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder={`${platform.name} username`}
            autoComplete="username"
            className={inputClassName()}
          />
        </div>

        <div>
          <FieldLabel>Password</FieldLabel>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className={inputClassName()}
          />
        </div>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:border-sky-400/40 hover:text-white"
        >
          Save credentials
        </button>

        <p className="text-center text-[11px] text-white/35">
          Mockup only — credentials will connect to the Social page in a future release.
        </p>
      </form>
    </article>
  );
}

export default function SettingsWorkspace() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-[#60a5fa]">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Social account settings</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/50">
              Enter LinkedIn and Instagram account details here. These fields are placeholders for
              now — they will power publishing on the{" "}
              <span className="inline-flex items-center gap-1 text-sky-300/90">
                <Share2 className="h-3.5 w-3.5" />
                Social
              </span>{" "}
              page when integrations are enabled.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {PLATFORMS.map((platform) => (
          <PlatformCredentialsCard key={platform.id} platform={platform} />
        ))}
      </div>
    </div>
  );
}
