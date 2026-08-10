"use client";

import HomeSectionTitle from "./HomeSectionTitle";
import HomeBusinessCaseStackTable from "./HomeBusinessCaseStackTable";
import HomeBusinessCaseTabbedVideo from "./HomeBusinessCaseTabbedVideo";

export default function HomeBusinessCase() {
  return (
    <section
      id="business-case"
      className="relative scroll-mt-20 overflow-x-hidden bg-[#030712] pt-4 pb-6 sm:scroll-mt-28 sm:pt-8 sm:pb-12 lg:pt-10 lg:pb-16"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(37,99,235,0.08), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(251,191,36,0.04), transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="business-case-fade-in mx-auto text-center">
          <HomeSectionTitle singleLine>The business case for Unit311 Central</HomeSectionTitle>
          <p className="mx-auto mt-6 max-w-3xl text-sm leading-relaxed text-white/60 sm:mt-8 sm:text-[16px] sm:leading-relaxed lg:text-[17px]">
            Growing companies hit a wall when disconnected software, duplicate information and manual
            reporting can&apos;t keep up — and another subscription doesn&apos;t fix it. The question
            isn&apos;t whether you need more business software. It&apos;s whether your team can get
            answers instantly, with AI intelligence across one connected operating layer, instead of
            logging into multiple systems and rebuilding the picture by hand.
          </p>
        </div>

        <div className="business-case-fade-in mt-12 lg:mt-16">
          <div className="overflow-hidden rounded-[28px] border border-white/[0.1] bg-gradient-to-br from-[#0a0f18]/95 via-[#070b14]/90 to-[#060a12]/95 shadow-[0_32px_80px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="flex flex-col gap-0 xl:flex-row xl:items-start">
              <div className="min-w-0 border-b border-sky-400/15 bg-sky-400/[0.08] p-4 sm:p-5 xl:w-[34%] xl:flex-none xl:border-b-0 xl:border-r xl:border-sky-400/15 xl:p-6">
                <HomeBusinessCaseStackTable />
              </div>
              <div className="w-full shrink-0 p-3 sm:p-4 lg:p-4 xl:w-[66%] xl:self-start xl:p-5">
                <HomeBusinessCaseTabbedVideo />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
