"use client";

import Link from "next/link";
import { ExternalLink, MessageCircle } from "lucide-react";

/**
 * In-app Support Desk entry for the WhatsApp support-flow console.
 * Opens the dedicated flow in the same origin (works on tenant hosts + overview).
 */
export default function WhatsAppIntegrationWorkspace() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Support Desk
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">WhatsApp Integration</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Operator console for inbound WhatsApp support tickets, assignment, and client
                messaging — same flow used by the live WhatsApp support channel.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/whatsapp/support-flow"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1F4FBF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2a5fd4]"
              >
                Open WhatsApp support flow
                <ExternalLink className="h-4 w-4 opacity-80" />
              </Link>
              <Link
                href="/whatsapp/support"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/[0.08]"
              >
                Client intake preview
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
