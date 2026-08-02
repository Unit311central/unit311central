"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { copyTextToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

type CopyToClipboardButtonProps = {
  text: string;
  label?: string;
  className?: string;
};

/** Standard Unit311 copy-to-clipboard control for AI / generated content panels. */
export function CopyToClipboardButton({
  text,
  label = "Copy",
  className,
}: CopyToClipboardButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyTextToClipboard(text);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.04] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-white/55 transition hover:border-emerald-400/35 hover:bg-emerald-500/10 hover:text-white",
        className,
      )}
      aria-label={copied ? "Copied" : label}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default CopyToClipboardButton;
