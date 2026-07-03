import type { Metadata } from "next";
import Image from "next/image";

import FounderSessionBooking from "@/components/book/FounderSessionBooking";
import { createPageMetadata } from "@/lib/metadata";

const BOOK_BACKGROUND = "/images/construction-bg.jpg";

export const metadata: Metadata = createPageMetadata({
  title: "Book a Founder Session",
  description:
    "Schedule a complimentary 30-minute founder session with Unit311 Central. Choose a weekday slot and receive your video meeting link by email.",
  path: "/book",
});

export default function BookPage() {
  return (
    <section className="relative min-h-screen overflow-x-hidden bg-[#020617]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src={BOOK_BACKGROUND}
          alt=""
          fill
          priority
          className="object-cover object-center grayscale"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#020617]/90" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(2, 6, 23, 0.55) 0%, rgba(2, 6, 23, 0.88) 45%, rgba(2, 6, 23, 0.96) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1100px] px-5 pb-20 pt-24 sm:px-8 sm:pb-24 sm:pt-[104px] lg:px-10 lg:pb-28 lg:pt-[120px]">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#93c5fd]">
            Unit311 Central
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Book a Complimentary Founder Session
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
            Pick a 30-minute slot, Monday to Friday, 9:00–18:00 UK time. We&apos;ll confirm by email and
            share your private video session link.
          </p>
        </div>

        <div className="mt-10 rounded-[28px] border border-white/15 bg-white/[0.1] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-6 lg:rounded-[32px] lg:p-8">
          <FounderSessionBooking />
        </div>
      </div>
    </section>
  );
}
