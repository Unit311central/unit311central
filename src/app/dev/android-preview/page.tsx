"use client";

import { useEffect, useMemo, useState } from "react";

const DEVICES = {
  "pixel-7": {
    label: "Google Pixel 7",
    width: 412,
    height: 915,
    userAgent: "Android 14 · Chrome",
  },
  "galaxy-s21": {
    label: "Samsung Galaxy S21",
    width: 360,
    height: 800,
    userAgent: "Android 13 · Chrome",
  },
} as const;

type DeviceId = keyof typeof DEVICES;

const QUICK_PATHS = [
  { label: "Home", path: "/" },
  { label: "Book demo", path: "/book" },
  { label: "Contact", path: "/contact" },
  { label: "FAQ", path: "/faq" },
  { label: "About", path: "/about" },
] as const;

export default function AndroidPreviewPage() {
  const [deviceId, setDeviceId] = useState<DeviceId>("pixel-7");
  const [path, setPath] = useState("/");
  const [reloadKey, setReloadKey] = useState(0);
  const [frameScale, setFrameScale] = useState(1);

  const device = DEVICES[deviceId];
  const iframeSrc = useMemo(() => `${path}${path.includes("?") ? "&" : "?"}_preview=1`, [path, reloadKey]);

  useEffect(() => {
    const updateScale = () => {
      setFrameScale(Math.min(1, (window.innerHeight - 160) / (device.height + 48)));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [device.height]);

  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      <header className="border-b border-white/10 bg-[#0a0f14] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
              Mobile preview
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">Android phone simulator</h1>
            <p className="mt-1 max-w-xl text-sm text-white/55">
              Interactive live view — scroll, tap links, and open the menu inside the phone. Use this
              to review mobile before your demo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["pixel-7", "galaxy-s21"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setDeviceId(id)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  deviceId === id
                    ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-100"
                    : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {DEVICES[id].label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
            >
              Reload
            </button>
          </div>
        </div>

        <div className="mx-auto mt-4 flex max-w-6xl flex-wrap gap-2">
          {QUICK_PATHS.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => setPath(item.path)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                path === item.path
                  ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
          <label className="flex min-w-[12rem] flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 sm:max-w-xs">
            Path
            <input
              value={path}
              onChange={(event) => setPath(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
              spellCheck={false}
            />
          </label>
        </div>
      </header>

      <div className="flex justify-center px-4 py-8 sm:py-12">
        <div
          className="origin-top"
          style={{
            transform: `scale(${frameScale})`,
            width: device.width + 24,
          }}
        >
          <div className="rounded-[2.5rem] border border-white/15 bg-[#1a1f26] p-3 shadow-[0_40px_120px_rgba(0,0,0,0.65)]">
            <div className="mb-2 flex items-center justify-between px-3 text-[10px] text-white/40">
              <span>{device.userAgent}</span>
              <span>
                {device.width}×{device.height}
              </span>
            </div>
            <div
              className="overflow-hidden rounded-[2rem] border border-black/80 bg-black"
              style={{ width: device.width, height: device.height }}
            >
              <iframe
                key={`${deviceId}-${reloadKey}-${path}`}
                title={`Android preview — ${device.label}`}
                src={iframeSrc}
                width={device.width}
                height={device.height}
                className="block border-0 bg-[#020617]"
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div className="mx-auto mt-3 h-1 w-28 rounded-full bg-white/20" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
