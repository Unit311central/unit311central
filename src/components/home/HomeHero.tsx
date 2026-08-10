import HeroVideoBackground from "./HeroVideoBackground";
import HomeBrandWordmark from "./HomeBrandWordmark";
import HomeHeroActions from "./HomeHeroActions";

export default function HomeHero() {
  return (
    <section className="relative bg-[#020617] sm:min-h-[100svh] sm:overflow-hidden">
      <div className="relative h-[clamp(220px,36svh,300px)] w-full shrink-0 overflow-hidden sm:absolute sm:inset-0 sm:h-full sm:min-h-[100svh]">
        <HeroVideoBackground />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-10 bg-gradient-to-b from-transparent to-[#020617] sm:hidden"
          aria-hidden
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1] hidden sm:block"
        aria-hidden
        style={{
          background:
            "linear-gradient(to right, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.45) 45%, rgba(0, 0, 0, 0.18) 70%, transparent 88%)",
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden pt-[max(0px,env(safe-area-inset-top))] lg:block">
        <div className="mx-auto flex h-28 max-w-[1400px] items-center px-10">
          <div className="pointer-events-auto max-w-[640px]">
            <HomeBrandWordmark />
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 pb-10 pt-7 sm:absolute sm:inset-x-0 sm:bottom-0 sm:flex sm:min-h-[100svh] sm:items-end sm:px-8 sm:pb-20 sm:pt-[6.5rem] lg:items-center lg:px-10 lg:pb-24 lg:pt-[120px]">
        <div className="relative max-w-[800px]">
          <h1 className="text-[1.75rem] font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-[2.75rem] sm:leading-[0.95] lg:text-[3.35rem] xl:text-[3.75rem]">
            <span className="block">One operating layer</span>
            <span className="block">for your whole company.</span>
          </h1>

          <p className="mt-5 max-w-[760px] text-[15px] font-medium leading-[1.65] text-white/88 sm:mt-6 sm:text-[17px] sm:leading-[1.7]">
            For funded startups and SMEs tired of poor visibility, expensive disconnected systems,
            and hunting for answers across multiple logins.
          </p>
          <p className="mt-4 max-w-[760px] text-[15px] font-medium leading-[1.65] text-white/88 sm:text-[17px] sm:leading-[1.7]">
            Consolidate where it makes sense, connect what stays, and give leadership and employees
            one place to run the business — with live insight across operations, finance, and
            projects.
          </p>

          <HomeHeroActions />
        </div>
      </div>
    </section>
  );
}
