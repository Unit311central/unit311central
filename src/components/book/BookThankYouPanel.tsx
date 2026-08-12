"use client";

import Link from "next/link";
import { useState } from "react";

import BookFocusGrid from "@/components/book/BookFocusGrid";
import {
  createEmptyBookThankYouSelections,
  type BookThankYouSelections,
} from "@/lib/book-thank-you-data";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";

type BookThankYouPanelProps = {
  sessionWhen: string;
  confirmationEmail: string;
  meetingLink?: string;
  onSubmit?: (selections: BookThankYouSelections) => Promise<void> | void;
  submitLabel?: string;
  showTestNotice?: boolean;
  submittedMessage?: string;
  defaultFocusExpanded?: boolean;
};

export default function BookThankYouPanel({
  sessionWhen,
  confirmationEmail,
  meetingLink,
  onSubmit,
  submitLabel = "Submit",
  showTestNotice = false,
  submittedMessage = "Thank you — your focus areas have been saved and shared with our team.",
  defaultFocusExpanded = false,
}: BookThankYouPanelProps) {
  const [selections, setSelections] = useState(createEmptyBookThankYouSelections);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusExpanded, setFocusExpanded] = useState(defaultFocusExpanded);

  async function handleSubmit() {
    if (!onSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(selections);
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit selections.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleToggle(key: string, checked: boolean) {
    setSelections((current) => ({
      items: { ...current.items, [key]: checked },
    }));
  }

  return (
    <div className="w-full rounded-2xl border border-white/40 bg-white/95 p-6 text-center shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:p-8 lg:p-10">
      {showTestNotice ? (
        <p className="mb-4 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
          Test page — add <span className="font-mono">?bookingId=&lt;uuid&gt;</span> to run the live
          PDF + CRM flow. Without it, submit is preview-only.
        </p>
      ) : null}

      <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
      <h2 className="mt-4 text-2xl font-semibold text-[#1a2b4a] sm:text-[1.65rem]">
        Thank you for booking a meeting.
      </h2>

      <div className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#1a2b4a]/75">
        <p>An email has been sent with the details and the link to join the session.</p>
      </div>

      <div className="mx-auto mt-6 max-w-2xl space-y-2 text-sm text-[#1a2b4a]/70">
        <p>
          Your session: <span className="font-medium text-[#1a2b4a]">{sessionWhen}</span>
        </p>
        <p>
          Confirmation sent to{" "}
          <span className="font-medium text-[#1a2b4a]">{confirmationEmail}</span>.
        </p>
        {meetingLink ? (
          <p>
            Link to meeting:{" "}
            <a
              href={meetingLink}
              className="font-medium text-[#2563eb] underline-offset-2 hover:underline"
            >
              Join your session
            </a>
          </p>
        ) : (
          <p className="text-[#1a2b4a]/55">Link to meeting</p>
        )}
        <p>
          For any questions please email{" "}
          <a
            href="mailto:info@unit311central.com"
            className="font-medium text-[#2563eb] underline-offset-2 hover:underline"
          >
            info@unit311central.com
          </a>
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-full text-left">
        <div className="text-center">
          <p className="text-sm leading-relaxed text-[#1a2b4a]/75">
            In order to have a productive session, please select the areas and modules you&apos;d most
            like to focus on
          </p>
        </div>
        <p className="mt-3 text-center text-sm font-bold text-[#0b2d63]">
          If you don&apos;t have time to do this now, don&apos;t worry, we&apos;ll chat on the call!
        </p>

        <button
          type="button"
          onClick={() => setFocusExpanded((current) => !current)}
          className="mt-5 flex w-full items-center justify-between gap-3 rounded-2xl border border-[#dbe4f0] bg-[#eef3f8] px-4 py-3.5 text-left text-sm font-semibold text-[#0b2d63] sm:px-5"
        >
          <span>Optional: choose focus areas for the call</span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 transition-transform ${focusExpanded ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>

        {focusExpanded ? (
          <div className="mt-3 rounded-2xl border border-[#dbe4f0] bg-[#eef3f8] p-3 sm:p-4">
            <BookFocusGrid selections={selections.items} onToggle={handleToggle} />
          </div>
        ) : null}
      </div>

      <div className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-[#1a2b4a]/75">
        <p>
          You can also have a look prior in our{" "}
          <Link href="/faq" className="font-medium text-[#2563eb] underline-offset-2 hover:underline">
            FAQ section
          </Link>{" "}
          on the website.
        </p>
      </div>

      {onSubmit ? (
        <div className="mx-auto mt-8 max-w-md">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || submitted}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#2563eb] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : submitted ? (
              "Submitted"
            ) : (
              submitLabel
            )}
          </button>
          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
          {submitted ? (
            <p className="mt-3 text-sm text-emerald-700">{submittedMessage}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
