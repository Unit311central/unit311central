"use client";

import HomeSectionTitle from "./HomeSectionTitle";
import HomeBusinessCaseStackTable from "./HomeBusinessCaseStackTable";
import HomeBusinessCaseTabbedVideo from "./HomeBusinessCaseTabbedVideo";

const PANEL_SHELL =
  "overflow-hidden rounded-[28px] border border-white/[0.1] bg-[#080d14] shadow-[0_32px_80px_rgba(0,0,0,0.45)]";

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
        </div>

        <div className="business-case-fade-in mt-12 flex flex-col gap-5 lg:mt-16 lg:gap-6">
          <div className={PANEL_SHELL}>
            <div className="bg-sky-400/[0.08] p-4 sm:p-5 lg:px-6 lg:pt-6 lg:pb-5">
              <HomeBusinessCaseStackTable />
            </div>
          </div>
          <div className={`${PANEL_SHELL} flex flex-col`}>
            <div className="px-3 pt-4 pb-3 sm:px-4 sm:pt-5 sm:pb-4 lg:px-5 lg:pt-6 lg:pb-5">
              <HomeBusinessCaseTabbedVideo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
