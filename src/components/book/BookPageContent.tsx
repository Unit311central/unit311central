"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import FounderSessionBooking from "@/components/book/FounderSessionBooking";
import {
  BOOK_SUBMITTED_EVENT,
  isBookFormSubmitted,
} from "@/lib/book-submission-state";

const BOOK_INTRO_BULLETS = [
  "Where your pain points are, and give an overview of the platform.",
  "Our team is available 9-6, Monday to Friday in GMT time.",
  "Choose a timeslot in your local timezone and we will convert it to GMT for us.",
  "We will then email a short overview of the call as a PDF after.",
  "From there you can decide if you want to progress — no obligations!",
] as const;

const MOBILE_INTRO_PREVIEW = 2;

export default function BookPageContent() {
  const [submitted, setSubmitted] = useState(() =>
    typeof window !== "undefined" ? isBookFormSubmitted() : false,
  );
  const [introExpanded, setIntroExpanded] = useState(false);

  useEffect(() => {
    function handleSubmitted() {
      setSubmitted(true);
    }

    window.addEventListener(BOOK_SUBMITTED_EVENT, handleSubmitted);
    return () => window.removeEventListener(BOOK_SUBMITTED_EVENT, handleSubmitted);
  }, []);

  const visibleBullets = introExpanded
    ? BOOK_INTRO_BULLETS
    : BOOK_INTRO_BULLETS.slice(0, MOBILE_INTRO_PREVIEW);

  return (
    <>
      {!submitted ? (
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            Book a free intro and demo session
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-white sm:mt-4 sm:text-base">
            We&apos;d love to have a short call to better understand your requirements
          </p>
          <div className="mx-auto mt-5 flex justify-center sm:mt-8">
            <div className="w-full max-w-3xl">
              <ul className="hidden space-y-2.5 text-left text-sm text-white sm:text-base md:block">
                {BOOK_INTRO_BULLETS.map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-2.5 text-left text-sm text-white md:hidden">
                {visibleBullets.map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              {BOOK_INTRO_BULLETS.length > MOBILE_INTRO_PREVIEW ? (
                <button
                  type="button"
                  onClick={() => setIntroExpanded((current) => !current)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-sky-200/90 md:hidden"
                >
                  {introExpanded
                    ? "Show less"
                    : `What else to expect (${BOOK_INTRO_BULLETS.length - MOBILE_INTRO_PREVIEW} more)`}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${introExpanded ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={`rounded-[28px] border border-white/15 bg-white/[0.1] shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-6 lg:rounded-[32px] lg:p-8 ${
          submitted
            ? "mx-auto mt-0 flex min-h-[min(72dvh,640px)] max-w-4xl items-center p-4 sm:min-h-[min(68dvh,720px)]"
            : "mt-6 p-4 sm:mt-10"
        }`}
      >
        <FounderSessionBooking onBookingSuccess={() => setSubmitted(true)} />
      </div>
    </>
  );
}
