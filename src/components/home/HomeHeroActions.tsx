"use client";

import Link from "next/link";
import { useState } from "react";

import Unit311CentralOverviewVideoModal from "./Unit311CentralOverviewVideoModal";

export default function HomeHeroActions() {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <>
      <div className="mt-8 flex w-full flex-col gap-3 sm:mt-14 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
        <Link
          href="/book"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-white px-5 text-center text-sm font-semibold leading-snug text-[#0b2d63] transition-colors hover:bg-white/90 sm:w-auto sm:px-6"
        >
          Book a free demo
        </Link>
        <button
          type="button"
          onClick={() => setVideoOpen(true)}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0b2d63] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#092454] sm:w-auto sm:px-6"
        >
          Watch Overview
        </button>
      </div>

      <Unit311CentralOverviewVideoModal open={videoOpen} onClose={() => setVideoOpen(false)} />
    </>
  );
}
