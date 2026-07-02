import Link from "next/link";
import HeroVideoBackground from "./HeroVideoBackground";

export default function HomeHero() {
  return (
    <section className="relative overflow-x-hidden bg-[#020617]">
      <HeroVideoBackground />

      {/* Legibility gradient — lighter on the right so video stays visible */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden
        style={{
          background:
            "linear-gradient(to right, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.38) 42%, rgba(0, 0, 0, 0.12) 68%, transparent 82%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1400px] px-5 pb-20 pt-24 sm:px-8 sm:pb-24 sm:pt-[104px] lg:px-10 lg:pb-28 lg:pt-[120px]">
        <div className="relative max-w-[560px]">
          <h1 className="text-[1.575rem] font-bold leading-[0.95] tracking-[-0.03em] text-white sm:text-[2.38rem] lg:text-[2.8rem] xl:text-[3.15rem]">
            <span className="mb-3 block sm:mb-4">FROM DRONE</span>
            <span className="mb-3 block sm:mb-4">TO</span>
            <span className="mb-5 block sm:mb-7">INTELLIGENCE</span>
          </h1>

          <p className="mb-8 mt-2 text-lg font-semibold tracking-tight text-[#3b82f6] sm:mb-10 sm:mt-3 sm:text-xl">
            Data. <span className="text-white">Insight.</span> Visibility.
          </p>

          <p className="text-[15px] leading-[1.65] text-white/88 sm:text-[17px]">
            We do more than just fly.
          </p>

          <p className="mt-4 max-w-[520px] text-base leading-[1.7] text-white/70 sm:text-[17px]">
            Drone Catalyst captures, processes and delivers aerial intelligence through
            a secure cloud platform, giving you access to your projects, reports and
            insights anytime, anywhere.
          </p>

          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/[0.08]"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
