import HeroVideoBackground from "./HeroVideoBackground";
import HomeBrandWordmark from "./HomeBrandWordmark";
import HomeHeroActions from "./HomeHeroActions";

export default function HomeHero() {
  return (
    <section className="relative flex flex-col bg-[#020617] lg:min-h-[100svh] lg:block lg:overflow-hidden">
      {/* Phones: nav clearance + 16:9 band (full frame). Desktop: full-bleed background. */}
      <div className="w-full shrink-0 lg:absolute lg:inset-0 lg:pt-0">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#020617] sm:aspect-video lg:absolute lg:inset-0 lg:aspect-auto">
          <HeroVideoBackground />
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1] hidden lg:block"
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

      <div className="relative z-10 mx-auto flex max-w-[1400px] flex-col px-4 py-8 sm:px-8 sm:py-10 lg:min-h-[100svh] lg:items-center lg:px-10 lg:py-24 lg:pt-[120px]">
        <div className="relative max-w-[800px]">
          <h1 className="text-[1.75rem] font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-[2.75rem] sm:leading-[0.95] lg:text-[3.35rem] xl:text-[3.75rem]">
            <span className="block">One operating layer</span>
            <span className="block">for your whole company</span>
          </h1>

          <p className="mt-5 max-w-[760px] text-[15px] font-medium leading-[1.65] text-white/88 sm:mt-6 sm:text-[17px] sm:leading-[1.7]">
            For funded startups and SMEs tired of poor visibility, expensive disconnected systems,
            and hunting for answers across multiple logins.
          </p>
          <p className="mt-4 max-w-[760px] text-[15px] font-medium leading-[1.65] text-white/88 sm:text-[17px] sm:leading-[1.7]">
            Consolidate where it makes sense, connect what stays, and give leadership and employees
            one place to run the business — with live insight across your entire business.
          </p>

          <HomeHeroActions />
        </div>
      </div>
    </section>
  );
}
