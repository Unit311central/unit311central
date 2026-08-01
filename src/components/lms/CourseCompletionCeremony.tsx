"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Download, PartyPopper, X } from "lucide-react";

type Props = {
  courseTitle: string;
  score?: number | null;
  certificateUrl?: string | null;
  certificateNumber?: string | null;
  onClose: () => void;
};

export default function CourseCompletionCeremony({
  courseTitle,
  score,
  certificateUrl,
  certificateNumber,
  onClose,
}: Props) {
  const [burst, setBurst] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setBurst(false), 2400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#07111f]/95 p-4 backdrop-blur-sm">
      <AnimatePresence>
        {burst
          ? Array.from({ length: 18 }).map((_, i) => (
              <motion.span
                key={i}
                className="pointer-events-none absolute h-2 w-2 rounded-full bg-emerald-400"
                initial={{
                  opacity: 1,
                  x: 0,
                  y: 0,
                  scale: 0.4,
                }}
                animate={{
                  opacity: 0,
                  x: Math.cos((i / 18) * Math.PI * 2) * (140 + (i % 5) * 24),
                  y: Math.sin((i / 18) * Math.PI * 2) * (100 + (i % 4) * 30),
                  scale: 1.4,
                }}
                transition={{ duration: 1.6, ease: "easeOut" }}
              />
            ))
          : null}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative w-full max-w-lg rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-[#0d1b2e] to-[#07111f] p-8 text-center shadow-2xl shadow-emerald-900/30"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-white/45 hover:bg-white/5 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <motion.div
          initial={{ rotate: -12, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300"
        >
          <PartyPopper className="h-8 w-8" />
        </motion.div>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
          Course complete
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{courseTitle}</h2>
        {typeof score === "number" ? (
          <p className="mt-2 text-sm text-white/60">
            Final score: <span className="font-semibold text-emerald-200">{score}%</span>
          </p>
        ) : null}

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center justify-center gap-2 text-emerald-200">
            <Award className="h-5 w-5" />
            <span className="text-sm font-semibold">Certificate ready</span>
          </div>
          {certificateNumber ? (
            <p className="text-xs text-white/45">{certificateNumber}</p>
          ) : null}
          {certificateUrl ? (
            <a
              href={certificateUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400"
            >
              <Download className="h-4 w-4" />
              Download certificate
            </a>
          ) : (
            <p className="mt-2 text-xs text-white/45">
              Your certificate will appear under Training → Certificates shortly.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 text-sm text-white/55 underline-offset-2 hover:text-white hover:underline"
        >
          Return to portal
        </button>
      </motion.div>
    </div>
  );
}
